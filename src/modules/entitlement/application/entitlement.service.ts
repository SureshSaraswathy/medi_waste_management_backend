import { ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit, Optional, UnprocessableEntityException } from '@nestjs/common';
import { AuthJwtService } from '../../auth/services/jwt.service';
import { ENTITLEMENT_ALL, EntitlementChangeListener, ListenConnection } from '../infrastructure/entitlement-change-listener';
import { ConfigService } from '@nestjs/config';
import {
  anyEffective, Catalogue, CatalogueNode, ChangeInput, effectiveSets, isCore, isEffective, isPlatformAdminUser, isSuperAdminUser, planChanges, StoredFlags, validateChanges,
} from '../domain/entitlement.rules';
import { EndpointMapRow, EntitlementRepository, ShadowEvent } from '../infrastructure/entitlement.repository';

export type RolloutMode = 'OFF' | 'SHADOW' | 'ENFORCE';
export const ROLLOUT_MODES: RolloutMode[] = ['OFF', 'SHADOW', 'ENFORCE'];

export const ENTITLEMENT_SERVICE_OPTIONS = 'ENTITLEMENT_SERVICE_OPTIONS';

export interface ServiceOptions {
  flagsTtlMs?: number;
  catalogueTtlMs?: number;
  modesTtlMs?: number;
  endpointMapTtlMs?: number;
  flushIntervalMs?: number;
}

interface Cached<T> { at: number; value: T }

/** Factory for the dedicated LISTEN connection; absent (or returning null) = no cross-process notification, TTL only. */
export const ENTITLEMENT_LISTEN_FACTORY = 'ENTITLEMENT_LISTEN_FACTORY';

@Injectable()
export class EntitlementService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EntitlementService.name);
  private readonly ttl: Required<ServiceOptions>;

  private catalogueCache: Cached<Catalogue> | null = null;
  private endpointCache: Cached<Map<string, EndpointMapRow>> | null = null;
  private modesCache: Cached<{ mode: RolloutMode; tenantMode: RolloutMode }> | null = null;
  private readonly flagsCache = new Map<string, Cached<{ flags: StoredFlags; version: string }>>();

  private readonly shadowBuf = new Map<string, ShadowEvent>();
  private readonly coverageBuf = new Map<string, { method: string; route: string; hits: number }>();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly repo: EntitlementRepository,
    @Optional() private readonly config?: ConfigService,
    @Optional() @Inject(ENTITLEMENT_SERVICE_OPTIONS) options: ServiceOptions = {},
    @Optional() @Inject(ENTITLEMENT_LISTEN_FACTORY) private readonly listenFactory?: (() => ListenConnection) | null,
    @Optional() private readonly jwt?: AuthJwtService,
  ) {
    this.ttl = {
      // safety net only: a Save/mode change NOTIFYs every process (see listener); the TTL covers a lost listener
      flagsTtlMs: options.flagsTtlMs ?? 10_000,
      catalogueTtlMs: options.catalogueTtlMs ?? 300_000,
      modesTtlMs: options.modesTtlMs ?? 10_000,
      endpointMapTtlMs: options.endpointMapTtlMs ?? 300_000,
      flushIntervalMs: options.flushIntervalMs ?? 30_000,
    };
  }

  private listener: EntitlementChangeListener | null = null;

  async onModuleInit(): Promise<void> {
    if (!this.listenFactory) return;
    this.listener = new EntitlementChangeListener(this.listenFactory, {
      onChange: (payload) => this.onRemoteChange(payload),
      onResync: () => this.onRemoteChange(ENTITLEMENT_ALL),
    });
    void this.listener.start(); // never throws; reconnects by itself
  }

  /** Another process (or this one) changed entitlements / modes: drop what we cached. */
  onRemoteChange(payload: string): void {
    if (payload && payload !== ENTITLEMENT_ALL) { this.flagsCache.delete(payload); return; }
    this.flagsCache.clear();
    this.modesCache = null;
  }

  get listening(): boolean {
    return !!this.listener && this.listener.connected;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.listener) await this.listener.stop();
    if (this.timer) clearInterval(this.timer);
    await this.flushNow().catch(() => undefined);
  }

  // ------------------------------------------------------------------ helpers
  /**
   * Platform administrator in the same sense as the existing PermissionsGuard: the SuperAdmin identity, the wildcard
   * permission '*' or the superadmin role. Used to exempt platform admins from licensing and tenant rules.
   * Managing entitlements themselves stays identity-only (see EntitlementAdminGuard).
   */
  isPlatformAdmin(user: any): boolean {
    const cfg = this.config ? this.config.get('app')?.superAdmin : undefined;
    return isPlatformAdminUser(user, cfg);
  }

  /**
   * The customer a list must ALWAYS be limited to (independent of the rollout modes): the caller's company, or
   * undefined for platform administrators (no limit). A non-platform caller without a company gets nothing.
   * Used where listing another customer's rows would expose credentials (e.g. download tokens).
   */
  customerScope(user: any): string | undefined {
    if (this.isPlatformAdmin(user)) return undefined;
    if (!user || !user.companyId) throw new ForbiddenException('Your account is not linked to a customer.');
    return String(user.companyId);
  }

  /**
   * Login-time check for the separately licensed channels (Mobile App, HCF Portal). ENFORCE refuses with a clear 403
   * before any token exists; SHADOW only records it; OFF does nothing. Callers never call it for SuperAdmin.
   */
  async assertChannelAllowed(companyId: string | null | undefined, feature: 'MOBILE_APP' | 'HCF_PORTAL', who: { userId?: string | null; route?: string } = {}): Promise<void> {
    if (!companyId) return;
    const modes = await this.getModes();
    if (modes.mode === 'OFF') return;
    if (await this.isEntitled(companyId, [feature])) return;
    const route = who.route || '/auth/login';
    if (modes.mode === 'SHADOW') {
      this.recordShadow({ companyId, method: 'POST', route, reason: 'DISABLED', userId: who.userId || null, detail: `login channel ${feature}` });
      return;
    }
    const message = feature === 'HCF_PORTAL'
      ? 'The HCF Portal is not enabled for your organisation. Please contact your administrator.'
      : 'The Mobile App is not enabled for your organisation. Please contact your administrator.';
    throw new ForbiddenException({ success: false, code: 'FEATURE_NOT_LICENSED', message, feature, channel: feature });
  }

  /**
   * For token-only links that carry no login (emailed download links): a platform administrator may still identify
   * themselves with a normal `Authorization: Bearer <jwt>` header. Anything invalid or absent is simply "not an admin".
   */
  async isPlatformAdminBearer(authorization?: string): Promise<boolean> {
    if (!this.jwt || !authorization || !/^Bearer\s+/i.test(authorization)) return false;
    try {
      const payload = await this.jwt.verifyToken(authorization.replace(/^Bearer\s+/i, '').trim());
      return this.isPlatformAdmin(payload);
    } catch {
      return false;
    }
  }

  isSuperAdmin(user: any): boolean {
    const cfg = this.config ? this.config.get('app')?.superAdmin : undefined;
    return isSuperAdminUser(user, cfg);
  }

  invalidate(companyId?: string): void {
    if (companyId) this.flagsCache.delete(companyId);
    else this.flagsCache.clear();
  }

  invalidateAll(): void {
    this.catalogueCache = null; this.endpointCache = null; this.modesCache = null; this.flagsCache.clear();
  }

  private fresh<T>(c: Cached<T> | null, ttl: number): c is Cached<T> {
    return !!c && Date.now() - c.at < ttl;
  }

  // ------------------------------------------------------------------ cached reads
  async getCatalogue(force = false): Promise<Catalogue> {
    if (!force && this.fresh(this.catalogueCache, this.ttl.catalogueTtlMs)) return this.catalogueCache.value;
    const value = new Catalogue(await this.repo.loadCatalogue());
    this.catalogueCache = { at: Date.now(), value };
    return value;
  }

  async getEndpointMap(): Promise<Map<string, EndpointMapRow>> {
    if (this.fresh(this.endpointCache, this.ttl.endpointMapTtlMs)) return this.endpointCache.value;
    let value = new Map<string, EndpointMapRow>();
    try {
      (await this.repo.loadEndpointMap()).forEach((r) => value.set(`${r.httpMethod} ${r.routePattern}`, r));
    } catch (err: any) {
      value = new Map(); // tables not migrated yet: nothing is mapped, and the mode is OFF anyway
      this.logger.warn(`endpoint map unavailable: ${err?.message}`);
    }
    this.endpointCache = { at: Date.now(), value };
    return value;
  }

  /** Both switches default to OFF when the tables or rows do not exist, so a missing migration is harmless. */
  async getModes(): Promise<{ mode: RolloutMode; tenantMode: RolloutMode }> {
    if (this.fresh(this.modesCache, this.ttl.modesTtlMs)) return this.modesCache.value;
    let value: { mode: RolloutMode; tenantMode: RolloutMode } = { mode: 'OFF', tenantMode: 'OFF' };
    try {
      const m = await this.repo.getSetting('mode');
      const t = await this.repo.getSetting('tenant_mode');
      value = { mode: (ROLLOUT_MODES as string[]).includes(m || '') ? (m as RolloutMode) : 'OFF', tenantMode: (ROLLOUT_MODES as string[]).includes(t || '') ? (t as RolloutMode) : 'OFF' };
    } catch {
      /* tables missing: stay OFF */
    }
    this.modesCache = { at: Date.now(), value };
    return value;
  }

  private async flagsFor(companyId: string): Promise<{ flags: StoredFlags; version: string }> {
    const hit = this.flagsCache.get(companyId);
    if (this.fresh(hit || null, this.ttl.flagsTtlMs)) return (hit as Cached<{ flags: StoredFlags; version: string }>).value;
    const value = await this.repo.loadCompanyFlags(companyId);
    this.flagsCache.set(companyId, { at: Date.now(), value });
    return value;
  }

  // ------------------------------------------------------------------ decisions
  /** ANY-OF check used by the request interceptor. */
  async isEntitled(companyId: string, codes: string[]): Promise<boolean> {
    const cat = await this.getCatalogue();
    const { flags } = await this.flagsFor(companyId);
    return anyEffective(cat, flags, codes);
  }

  async isRouteEntitled(companyId: string, code: string): Promise<boolean> {
    return this.isEntitled(companyId, [code]);
  }

  /**
   * Token-based download links have no logged-in user, so the owning customer is stored with the link.
   * Returns true only when the link must be REFUSED now: mode ENFORCE and the customer is no longer entitled.
   * In SHADOW the would-be refusal is logged; with OFF, or for old links with no recorded customer, it never refuses.
   */
  async shouldDenyDownload(companyId: string | null | undefined, codes: string[], route: string): Promise<boolean> {
    if (!companyId) return false;
    const { mode } = await this.getModes();
    if (mode === 'OFF') return false;
    if (await this.isEntitled(companyId, codes)) return false;
    if (mode === 'SHADOW') {
      this.recordShadow({ companyId, method: 'GET', route, reason: 'DISABLED', detail: 'token download link' });
      return false;
    }
    return true;
  }

  /** What the browser needs: enabled codes only, never the unpurchased catalogue. */
  async effectiveFor(companyId: string) {
    const cat = await this.getCatalogue();
    const { flags, version } = await this.flagsFor(companyId);
    const modes = await this.getModes();
    return { ...modes, version, ...effectiveSets(cat, flags) };
  }

  // ------------------------------------------------------------------ admin: catalogue and trees
  async getCatalogueTree() {
    const cat = await this.getCatalogue(true);
    const view = (n: CatalogueNode) => ({ code: n.code, name: n.name, type: n.type, core: isCore(cat, n.code), introducedIn: n.introducedIn || null, route: n.route || null, featureType: n.featureType || null, enforcement: n.enforcement || null, permissionCode: n.permissionCode || null });
    return cat.modules().map((m) => ({ ...view(m), submodules: cat.childrenOf(m.code).map((s) => ({ ...view(s), features: cat.childrenOf(s.code).map(view) })) }));
  }

  async listCompanies() {
    return this.repo.listCompanies();
  }

  async getCompanyTree(companyId: string) {
    const company = await this.repo.companyExists(companyId);
    if (!company) throw new NotFoundException('Customer not found');
    const cat = await this.getCatalogue(true);
    const { flags, version } = await this.repo.loadCompanyFlags(companyId); // admin reads are never cached
    const view = (n: CatalogueNode) => {
      const core = isCore(cat, n.code);
      const stored = core ? true : flags.has(n.code) ? (flags.get(n.code) as boolean) : null;
      return { code: n.code, name: n.name, type: n.type, core, stored, effective: isEffective(cat, flags, n.code), isNew: !core && !flags.has(n.code), introducedIn: n.introducedIn || null, route: n.route || null, featureType: n.featureType || null, enforcement: n.enforcement || null };
    };
    const modules = cat.modules().map((m) => ({ ...view(m), submodules: cat.childrenOf(m.code).map((s) => ({ ...view(s), features: cat.childrenOf(s.code).map(view) })) }));
    const all = [...cat.byCode.values()].filter((n) => n.active);
    const newItems = all.filter((n) => !isCore(cat, n.code) && !flags.has(n.code)).length;
    return { company, version, modes: await this.getModes(), totals: { items: all.length, effective: all.filter((n) => isEffective(cat, flags, n.code)).length, newItems }, modules };
  }

  // ------------------------------------------------------------------ admin: save
  async save(companyId: string, input: { changes: ChangeInput[]; expectedVersion?: string | null; reason?: string | null }, actor: { userId: string | null; userName: string | null }) {
    const company = await this.repo.companyExists(companyId);
    if (!company) throw new NotFoundException('Customer not found');
    const cat = await this.getCatalogue(true);
    const changes = Array.isArray(input.changes) ? input.changes : [];
    const errors = validateChanges(cat, changes);
    if (errors.length) throw new UnprocessableEntityException({ code: errors.some((e) => e.error === 'CORE_LOCKED') ? 'CORE_LOCKED' : 'VALIDATION_FAILED', errors, message: errors[0].message });

    const current = await this.repo.loadCompanyFlags(companyId);
    if (input.expectedVersion && input.expectedVersion !== current.version) {
      throw new ConflictException({ code: 'VERSION_CONFLICT', currentVersion: current.version, message: 'Another SuperAdmin changed this customer since you opened it. Reload and review.' });
    }
    const plan = planChanges(cat, current.flags, changes);
    if (plan.length === 0) return { changed: 0, batchId: null, version: current.version };

    const batchId = await this.repo.applyChanges(companyId, plan, { userId: actor.userId, userName: actor.userName, reason: input.reason || null, action: 'SET' });
    this.invalidate(companyId); // this process sees the change immediately; other processes within the cache TTL
    const after = await this.repo.loadCompanyFlags(companyId);
    this.logger.log(`entitlements saved: company=${company.companyCode} changes=${plan.length} by=${actor.userName || actor.userId}`);
    return { changed: plan.length, batchId, version: after.version };
  }

  async getAudit(companyId: string, opts: { page?: number; pageSize?: number; code?: string; user?: string; from?: string; to?: string }) {
    if (!(await this.repo.companyExists(companyId))) throw new NotFoundException('Customer not found');
    const pageSize = Math.min(200, Math.max(1, opts.pageSize || 50));
    const page = Math.max(1, opts.page || 1);
    return { page, pageSize, ...(await this.repo.getAudit(companyId, { ...opts, page, pageSize })) };
  }

  // ------------------------------------------------------------------ admin: rollout modes
  async setModes(input: { mode?: string; tenantMode?: string }, userId: string | null) {
    for (const [key, value] of [['mode', input.mode], ['tenant_mode', input.tenantMode]] as const) {
      if (value === undefined) continue;
      if (!(ROLLOUT_MODES as string[]).includes(value)) throw new UnprocessableEntityException({ code: 'INVALID_MODE', message: `${key} must be one of ${ROLLOUT_MODES.join(', ')}` });
      await this.repo.setSetting(key, value, userId);
      this.logger.warn(`entitlement ${key} set to ${value} by ${userId}`);
    }
    this.modesCache = null;
    return this.getModes();
  }

  // ------------------------------------------------------------------ shadow log and coverage
  recordShadow(e: { companyId: string; method: string; route: string; reason: string; userId?: string | null; detail?: string | null }): void {
    const day = new Date().toISOString().slice(0, 10);
    const key = `${day}|${e.companyId}|${e.method}|${e.route}|${e.reason}`;
    const cur = this.shadowBuf.get(key);
    if (cur) { cur.hits += 1; cur.userId = e.userId || cur.userId; }
    else this.shadowBuf.set(key, { day, companyId: e.companyId, method: e.method, route: e.route, reason: e.reason, hits: 1, userId: e.userId || null, detail: e.detail || null });
    this.ensureTimer();
  }

  recordCoverage(method: string, route: string): void {
    const key = `${method} ${route}`;
    const cur = this.coverageBuf.get(key);
    if (cur) cur.hits += 1; else this.coverageBuf.set(key, { method, route, hits: 1 });
    this.ensureTimer();
  }

  private ensureTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => { void this.flushNow(); }, this.ttl.flushIntervalMs);
    this.timer.unref?.();
  }

  async flushNow(): Promise<void> {
    const shadow = [...this.shadowBuf.values()];
    const coverage = [...this.coverageBuf.values()];
    this.shadowBuf.clear(); this.coverageBuf.clear();
    try {
      if (shadow.length) await this.repo.flushShadow(shadow);
      if (coverage.length) await this.repo.flushCoverage(new Date().toISOString().slice(0, 10), coverage);
    } catch (err: any) {
      // put them back so nothing is lost if the tables are not migrated yet
      shadow.forEach((s) => this.shadowBuf.set(`${s.day}|${s.companyId}|${s.method}|${s.route}|${s.reason}`, s));
      coverage.forEach((c) => this.coverageBuf.set(`${c.method} ${c.route}`, c));
      this.logger.warn(`could not flush shadow log: ${err?.message}`);
    }
  }

  async getShadowReport(days = 14) {
    await this.flushNow();
    const r = await this.repo.shadowReport(days);
    const modes = await this.getModes();
    return { days, modes, generatedOn: new Date().toISOString(), ...r };
  }
}
