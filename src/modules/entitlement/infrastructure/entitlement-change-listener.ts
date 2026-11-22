import { Logger } from '@nestjs/common';

/** PostgreSQL channel used to tell every backend process that entitlements or rollout modes changed. */
export const ENTITLEMENT_CHANNEL = 'entitlement_changed';
/** Payload meaning "everything" (rollout mode changes); otherwise the payload is a company id. */
export const ENTITLEMENT_ALL = '*';

/** A dedicated connection that can LISTEN. The production implementation uses the `pg` driver already installed. */
export interface ListenConnection {
  connect(): Promise<void>;
  listen(channel: string, onPayload: (payload: string) => void): Promise<void>;
  /** called once when the connection is lost (error or end) */
  onClose(cb: (err?: Error) => void): void;
  close(): Promise<void>;
}

export interface ListenerHandlers {
  /** a company id, or ENTITLEMENT_ALL */
  onChange(payload: string): void;
  /** called after every (re)connect: notifications may have been missed while disconnected */
  onResync(): void;
}

/**
 * Keeps one LISTEN connection alive. Never throws into the application: when the connection cannot be made or is lost
 * it retries with exponential backoff (minDelayMs .. maxDelayMs) and, once connected again, asks for a full resync
 * because messages sent in the meantime were not received. While it is down the normal cache TTL is the safety net.
 */
export class EntitlementChangeListener {
  private readonly logger = new Logger(EntitlementChangeListener.name);
  private conn: ListenConnection | null = null;
  private timer: NodeJS.Timeout | null = null;
  private stopped = true;
  private attempts = 0;
  private connecting = false;
  public connected = false;
  public reconnects = 0;

  constructor(
    private readonly factory: () => ListenConnection,
    private readonly handlers: ListenerHandlers,
    private readonly opts: { minDelayMs?: number; maxDelayMs?: number } = {},
  ) {}

  async start(): Promise<void> {
    this.stopped = false;
    await this.connect();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const c = this.conn;
    this.conn = null;
    this.connected = false;
    if (c) await c.close().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    if (this.stopped || this.connecting) return;
    this.connecting = true;
    let conn: ListenConnection | null = null;
    try {
      conn = this.factory();
      await conn.connect();
      const live = conn;
      conn.onClose((err) => this.lost(live, err));
      await conn.listen(ENTITLEMENT_CHANNEL, (payload) => {
        try { this.handlers.onChange(payload || ENTITLEMENT_ALL); } catch (e: any) { this.logger.warn(`change handler failed: ${e?.message}`); }
      });
      if (this.stopped) { await conn.close().catch(() => undefined); return; }
      this.conn = conn;
      this.connected = true;
      if (this.attempts > 0) this.reconnects += 1;
      this.attempts = 0;
      this.handlers.onResync(); // anything sent while we were not listening was missed
      this.logger.log('listening for entitlement changes');
    } catch (err: any) {
      if (conn) await conn.close().catch(() => undefined);
      this.logger.warn(`entitlement listener could not connect (${err?.message}); the cache TTL covers until it does`);
      this.schedule();
    } finally {
      this.connecting = false;
    }
  }

  private lost(conn: ListenConnection, err?: Error): void {
    if (this.conn !== conn) return; // an old connection or a deliberate stop
    this.conn = null;
    this.connected = false;
    if (!this.stopped) this.logger.warn(`entitlement listener connection lost${err ? ` (${err.message})` : ''}; reconnecting`);
    void conn.close().catch(() => undefined);
    this.schedule();
  }

  private schedule(): void {
    if (this.stopped || this.timer) return;
    const min = this.opts.minDelayMs ?? 500;
    const max = this.opts.maxDelayMs ?? 30_000;
    const delay = Math.min(max, min * 2 ** Math.min(this.attempts, 10));
    this.attempts += 1;
    this.timer = setTimeout(() => { this.timer = null; void this.connect(); }, delay);
    if (this.timer.unref) this.timer.unref();
  }
}

/** Production connection: a dedicated `pg` client (not taken from the TypeORM pool, which cannot hold a LISTEN). */
export class PgListenConnection implements ListenConnection {
  private client: any;
  constructor(private readonly options: { host?: string; port?: number; username?: string; user?: string; password?: any; database?: string; ssl?: any }) {}

  async connect(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Client } = require('pg');
    const o = this.options;
    this.client = new Client({ host: o.host, port: o.port, user: o.username || o.user, password: o.password, database: o.database, ssl: o.ssl, keepAlive: true, application_name: 'entitlement-listener' });
    this.client.on('error', () => undefined); // reported through onClose
    await this.client.connect();
  }

  async listen(channel: string, onPayload: (payload: string) => void): Promise<void> {
    this.client.on('notification', (m: any) => { if (m.channel === channel) onPayload(m.payload); });
    await this.client.query(`LISTEN ${channel}`);
  }

  onClose(cb: (err?: Error) => void): void {
    let done = false;
    const once = (err?: Error) => { if (!done) { done = true; cb(err); } };
    this.client.on('error', once);
    this.client.on('end', () => once());
  }

  async close(): Promise<void> {
    try { await this.client?.end(); } catch { /* already closed */ }
  }
}
