// LISTEN/NOTIFY across two backend service instances connected to a REAL PostgreSQL server.
// It creates a THROWAWAY database on the server named in the backend's .env (never one of the project databases),
// applies only migrations 001 + 002 there, runs the checks, and drops the database again. Nothing else is touched.
// Env: DIST (compiled backend). Run from the backend folder: DIST=<dist> node test/entitlements/test-listener-pg.js
require('reflect-metadata');
const fs = require('fs'), path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client, Pool } = require('pg');
const DIST = process.env.DIST;
const { EntitlementRepository } = require(DIST + '/modules/entitlement/infrastructure/entitlement.repository');
const { EntitlementService } = require(DIST + '/modules/entitlement/application/entitlement.service');
const { PgListenConnection } = require(DIST + '/modules/entitlement/infrastructure/entitlement-change-listener');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, limit = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < limit) { if (await fn()) return Date.now() - t0; await sleep(5); } return -1; };

const server = { host: process.env.MASTER_DB_HOST || 'localhost', port: parseInt(process.env.MASTER_DB_PORT || '5432', 10), user: process.env.MASTER_DB_USERNAME, password: process.env.MASTER_DB_PASSWORD };
const DBNAME = `entitlement_listener_test_${Date.now()}`;
const migrationsDir = path.resolve(__dirname, '../../migrations');

// SqlRunner over a pg Pool (what the production DataSourceRunner does over TypeORM)
const runnerOver = (pool) => ({
  async query(sql, params) { return (await pool.query(sql, params || [])).rows; },
  async transaction(work) {
    const c = await pool.connect();
    try { await c.query('BEGIN'); const r = await work({ query: async (s, p) => (await c.query(s, p || [])).rows, transaction: (w) => w(this) }); await c.query('COMMIT'); return r; }
    catch (e) { await c.query('ROLLBACK').catch(() => undefined); throw e; } finally { c.release(); }
  },
});

(async () => {
  const admin = new Client({ ...server, database: 'postgres' });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${DBNAME}"`);
  const conn = { ...server, database: DBNAME };
  const cleanup = async () => {
    await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [DBNAME]).catch(() => undefined);
    await sleep(200);
    await admin.query(`DROP DATABASE IF EXISTS "${DBNAME}"`).catch((e) => console.log('cleanup warning:', e.message));
    await admin.end().catch(() => undefined);
  };
  try {
    const setup = new Client(conn); await setup.connect();
    await setup.query(`CREATE TABLE companies (company_id uuid PRIMARY KEY, company_code varchar(50), company_name varchar(255), status varchar(20) DEFAULT 'Active', is_deleted boolean DEFAULT false)`);
    await setup.query(`INSERT INTO companies (company_id, company_code, company_name) VALUES ('11111111-1111-4111-8111-111111111111','C1','Customer One'),('22222222-2222-4222-8222-222222222222','C2','Customer Two')`);
    for (const f of ['entitlements_001_schema.sql', 'entitlements_002_catalogue_seed.sql']) await setup.query(fs.readFileSync(path.join(migrationsDir, f), 'utf8'));
    await setup.end();
    const C1 = '11111111-1111-4111-8111-111111111111';
    const cfg = { get: (k) => (k === 'app' ? { superAdmin: {} } : undefined) };
    const opts = { flagsTtlMs: 600000, modesTtlMs: 600000, flushIntervalMs: 3600000 }; // only NOTIFY can explain fresh answers
    const mk = () => { const pool = new Pool({ ...conn, max: 4 }); const svc = new EntitlementService(EntitlementRepository.over(runnerOver(pool)), cfg, opts, () => new PgListenConnection(conn)); return { pool, svc }; };
    const X = mk(), Y = mk(); // two instances: own pool, own caches, own LISTEN session (like two PM2 processes)
    await X.svc.onModuleInit(); await Y.svc.onModuleInit();
    await until(() => X.svc.listening && Y.svc.listening, 5000);
    ok(X.svc.listening && Y.svc.listening, 'two service instances are connected and listening');
    const sessions = (await admin.query(`SELECT count(*)::int n FROM pg_stat_activity WHERE datname=$1 AND application_name='entitlement-listener'`, [DBNAME])).rows[0].n;
    ok(sessions === 2, 'PostgreSQL shows two separate listener sessions (application_name = entitlement-listener)', String(sessions));
    const CODE = ['FINANCE.INVOICE_MGMT.VIEW'];
    const actor = { userId: null, userName: 'test' };
    await X.svc.save(C1, { changes: [{ code: 'FINANCE', enabled: true }, { code: 'FINANCE.INVOICE_MGMT', enabled: true }, { code: 'FINANCE.INVOICE_MGMT.VIEW', enabled: true }] }, actor);
    ok(await Y.svc.isEntitled(C1, CODE) === true, 'Y warms its cache: entitled');

    console.log('\n[1] a save in X reaches Y within one second');
    const lat = [];
    for (let i = 0; i < 5; i++) {
      const enabled = i % 2 === 1;
      const t0 = Date.now();
      await X.svc.save(C1, { changes: [{ code: 'FINANCE', enabled }] }, actor);
      const ms = await until(async () => (await Y.svc.isEntitled(C1, CODE)) === enabled, 1000);
      lat.push(ms === -1 ? 9999 : Date.now() - t0);
    }
    ok(lat.every((v) => v < 1000), `5 consecutive changes visible in Y within one second (end-to-end incl. the save): ${lat.join(', ')} ms`);

    console.log('\n[2] a rollout-mode change in X reaches Y within one second');
    ok((await Y.svc.getModes()).mode === 'OFF', 'Y has mode OFF cached');
    const t1 = Date.now(); await X.svc.setModes({ mode: 'SHADOW', tenantMode: 'SHADOW' }, null);
    const mm = await until(async () => (await Y.svc.getModes()).mode === 'SHADOW' && (await Y.svc.getModes()).tenantMode === 'SHADOW', 1000);
    ok(mm >= 0, `Y sees SHADOW/SHADOW after ${Date.now() - t1} ms`);
    await Y.svc.setModes({ mode: 'OFF', tenantMode: 'OFF' }, null);
    ok((await until(async () => (await X.svc.getModes()).mode === 'OFF', 1000)) >= 0, 'and the reverse direction (Y -> X) works');

    console.log('\n[3] notifications follow commit/rollback');
    const probe = new Client(conn); await probe.connect(); let got = 0;
    probe.on('notification', () => { got += 1; }); await probe.query('LISTEN entitlement_changed');
    await X.svc.save(C1, { changes: [{ code: 'NO.SUCH.CODE', enabled: true }] }, actor).catch(() => undefined); // rejected by validation: nothing written
    await sleep(300);
    ok(got === 0, 'a rejected save sends no notification');
    await X.svc.save(C1, { changes: [{ code: 'FINANCE', enabled: true }] }, actor); await sleep(300);
    ok(got >= 1, 'a committed save sends one');
    await probe.end();

    console.log('\n[4] listener connection killed on the server (like a restart / network drop)');
    const victim = (await admin.query(`SELECT pid FROM pg_stat_activity WHERE datname=$1 AND application_name='entitlement-listener' ORDER BY backend_start DESC LIMIT 1`, [DBNAME])).rows[0].pid;
    await admin.query('SELECT pg_terminate_backend($1)', [victim]);
    await sleep(100);
    const downs = [X.svc.listening, Y.svc.listening].filter((v) => !v).length;
    ok(downs === 1, 'exactly one instance notices its connection is gone');
    const down = X.svc.listening ? Y : X, up = down === X ? Y : X;
    await up.svc.save(C1, { changes: [{ code: 'FINANCE', enabled: false }] }, actor); // sent while "down" is not listening
    const back = await until(() => down.svc.listening, 8000);
    ok(back >= 0, `it reconnects by itself (${back} ms)`);
    ok((await until(async () => (await down.svc.isEntitled(C1, CODE)) === false, 1000)) >= 0, 'after reconnecting it resyncs: the change it could not hear is visible');
    await up.svc.save(C1, { changes: [{ code: 'FINANCE', enabled: true }] }, actor);
    ok((await until(async () => (await down.svc.isEntitled(C1, CODE)) === true, 1000)) >= 0, 'and later changes arrive by notification again');
    const s2 = (await admin.query(`SELECT count(*)::int n FROM pg_stat_activity WHERE datname=$1 AND application_name='entitlement-listener'`, [DBNAME])).rows[0].n;
    ok(s2 === 2, 'no leaked sessions after the reconnect: still exactly two listener sessions', String(s2));

    console.log('\n[5] database restart-like outage: every connection dropped at once');
    await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND application_name='entitlement-listener'`, [DBNAME]);
    await sleep(100);
    ok(!X.svc.listening && !Y.svc.listening, 'both notice');
    ok((await until(() => X.svc.listening && Y.svc.listening, 8000)) >= 0, 'both reconnect');
    await X.svc.save(C1, { changes: [{ code: 'FINANCE', enabled: false }] }, actor);
    ok((await until(async () => (await Y.svc.isEntitled(C1, CODE)) === false, 1000)) >= 0, 'propagation works again afterwards');

    await X.svc.onModuleDestroy(); await Y.svc.onModuleDestroy();
    await sleep(200);
    const left = (await admin.query(`SELECT count(*)::int n FROM pg_stat_activity WHERE datname=$1 AND application_name='entitlement-listener'`, [DBNAME])).rows[0].n;
    ok(left === 0, 'shutdown closes both listener sessions', String(left));
    await X.pool.end(); await Y.pool.end();
  } finally {
    await cleanup();
  }
  console.log(`\nRESULT: ${pass} passed, ${fail} failed (throwaway database ${DBNAME} dropped)`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
