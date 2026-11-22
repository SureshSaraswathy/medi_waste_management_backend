// Cross-process cache invalidation (PostgreSQL LISTEN/NOTIFY): two INDEPENDENT service instances (own repository, own
// caches, own listener) over one database, standing in for two backend processes. Uses PGlite (in-memory PostgreSQL).
// Env: BE (backend folder), DIST (compiled backend), PGT (folder with replica.js), NODE_PATH with pglite.
const fs = require('fs');
const BE = process.env.BE, DIST = process.env.DIST;
const { loadReal, build } = require(process.env.PGT + '/replica');
const { runAll, FILES } = require(BE + '/scripts/entitlements/run-migrations.js');
const { EntitlementRepository } = require(DIST + '/modules/entitlement/infrastructure/entitlement.repository');
const { EntitlementService } = require(DIST + '/modules/entitlement/application/entitlement.service');
const { EntitlementChangeListener, ENTITLEMENT_CHANNEL } = require(DIST + '/modules/entitlement/infrastructure/entitlement-change-listener');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const runner = (db) => ({ async query(s, p) { return (await db.query(s, p || [])).rows; }, async transaction(w) { return db.transaction(async (tx) => w(runner(tx))); } });
/** waits until fn() is true; returns elapsed ms or -1 */
const until = async (fn, limit = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < limit) { if (await fn()) return Date.now() - t0; await sleep(10); } return -1; };

// a ListenConnection backed by PGlite, with a way to cut the connection like a network failure would
const mkConn = (db, state) => {
  let unsub = null, closeCb = null, closed = false;
  const c = {
    async connect() { if (state.failConnect > 0) { state.failConnect -= 1; throw new Error('connection refused (test)'); } state.connects += 1; },
    async listen(channel, cb) { unsub = await db.listen(channel, (p) => { if (!closed && !state.deaf) cb(p); }); },
    onClose(cb) { closeCb = cb; },
    async close() { closed = true; if (unsub) { try { await unsub(); } catch { /* ignore */ } unsub = null; } },
    drop() { closed = true; if (closeCb) closeCb(new Error('terminating connection (test)')); },
  };
  state.current = c;
  return c;
};

(async () => {
  const real = await loadReal();
  const db = await build(real);
  const migr = await runAll({ client: { query: async (s, p) => (p ? db.query(s, p) : (await db.exec(s)).slice(-1)[0] || { rows: [] }) }, files: FILES.map(([id, f]) => [id, fs.readFileSync(`${BE}/migrations/${f}`, 'utf8')]), log: () => {} });
  if (!migr.ok) throw new Error('migration failed: ' + migr.reason);
  const [A] = real.companies.rows.filter((c) => !c.is_deleted);
  const cfg = { get: (k) => (k === 'app' ? { superAdmin: {} } : undefined) };
  const LONG = { flagsTtlMs: 600000, modesTtlMs: 600000, flushIntervalMs: 3600000 }; // TTL so long that only NOTIFY can explain a fresh answer
  const mkSvc = (state, opts = LONG, listenOpts) => {
    const svc = new EntitlementService(EntitlementRepository.over(runner(db)), cfg, opts, state ? () => mkConn(db, state) : null);
    if (state) { svc.listenerOpts = listenOpts; }
    return svc;
  };
  const CODE = ['FINANCE.INVOICE_MGMT.VIEW'];
  const save = (svc, enabled) => svc.save(A.company_id, { changes: [{ code: 'FINANCE', enabled }] }, { userId: null, userName: 'test' });

  console.log('[1] a Save in process X reaches process Y within one second');
  const sx = { connects: 0, failConnect: 0 }, sy = { connects: 0, failConnect: 0 };
  const X = mkSvc(sx), Y = mkSvc(sy);
  await X.onModuleInit(); await Y.onModuleInit();
  await until(() => X.listening && Y.listening);
  ok(X.listening && Y.listening, 'both instances are listening');
  ok(await Y.isEntitled(A.company_id, CODE) === true, 'Y warms its cache: entitled');
  const t0 = Date.now();
  await save(X, false);
  const ms = await until(async () => (await Y.isEntitled(A.company_id, CODE)) === false, 1000);
  ok(ms >= 0, `Y sees the revoked feature after ${ms} ms (limit 1000 ms) although its TTL is 10 minutes`, `elapsed ${Date.now() - t0} ms`);
  await save(X, true);
  ok((await until(async () => (await Y.isEntitled(A.company_id, CODE)) === true, 1000)) >= 0, 'and sees it restored within one second');
  const other = real.companies.rows.filter((c) => !c.is_deleted)[1];
  await Y.isEntitled(other.company_id, CODE);
  await X.save(other.company_id, { changes: [{ code: 'FINANCE', enabled: false }] }, { userId: null, userName: 'test' });
  ok((await until(async () => (await Y.isEntitled(other.company_id, CODE)) === false, 1000)) >= 0, 'a change for another customer is picked up too');

  console.log('\n[2] rollout mode changes');
  ok((await Y.getModes()).mode === 'OFF', 'Y has cached mode OFF');
  await X.setModes({ mode: 'ENFORCE' }, null);
  ok((await until(async () => (await Y.getModes()).mode === 'ENFORCE', 1000)) >= 0, 'Y sees ENFORCE within one second');
  await X.setModes({ mode: 'OFF' }, null);
  ok((await until(async () => (await Y.getModes()).mode === 'OFF', 1000)) >= 0, 'and OFF again');

  console.log('\n[3] notifications are transactional');
  let got = 0;
  const unsub = await db.listen(ENTITLEMENT_CHANNEL, () => { got += 1; });
  await db.transaction(async (tx) => { await tx.query(`SELECT pg_notify($1, 'x')`, [ENTITLEMENT_CHANNEL]); throw new Error('rollback'); }).catch(() => undefined);
  await sleep(200);
  ok(got === 0, 'a rolled-back change sends no notification');
  await unsub();

  console.log('\n[4] listener disconnect and reconnect');
  const sz = { connects: 0, failConnect: 0 };
  // Z: a short reconnect delay and a 1.5 s TTL as the fallback
  const Z = new EntitlementService(EntitlementRepository.over(runner(db)), cfg, { flagsTtlMs: 1500, modesTtlMs: 600000, flushIntervalMs: 3600000 }, () => mkConn(db, sz));
  const origStart = EntitlementChangeListener.prototype.start;
  EntitlementChangeListener.prototype.start = function () { this.opts = { minDelayMs: 100, maxDelayMs: 400 }; return origStart.call(this); };
  await Z.onModuleInit();
  await until(() => Z.listening);
  ok(Z.listening, 'Z listening');
  await Z.isEntitled(A.company_id, CODE); // cached: true
  sz.current.drop(); // the connection dies
  await sleep(50);
  ok(!Z.listening, 'Z notices the lost connection');
  await save(X, false); // a change Z cannot hear
  ok(await Z.isEntitled(A.company_id, CODE) === true, 'while disconnected Z still serves its cached (stale) answer ...');
  const rc = await until(() => Z.listening, 3000);
  ok(rc >= 0 && sz.connects === 2, `Z reconnects by itself (${rc} ms) and listens again`, JSON.stringify(sz));
  ok(await Z.isEntitled(A.company_id, CODE) === false, '... and after reconnecting it resyncs at once: the missed change is visible immediately');
  await save(X, true);
  ok((await until(async () => (await Z.isEntitled(A.company_id, CODE)) === true, 1000)) >= 0, 'changes after the reconnect arrive by notification again');
  // TTL fallback while deaf (listening but receiving nothing)
  sz.deaf = true;
  await Z.isEntitled(A.company_id, CODE);
  await save(X, false);
  ok(await Z.isEntitled(A.company_id, CODE) === true, 'deaf listener: stale answer right after the change');
  ok((await until(async () => (await Z.isEntitled(A.company_id, CODE)) === false, 3000)) >= 0, 'the 1.5 s TTL fallback corrects it (production default: 10 s)');
  sz.deaf = false;
  await save(X, true);

  console.log('\n[5] connection failures never reach the application');
  const sf = { connects: 0, failConnect: 2 };
  const F = new EntitlementService(EntitlementRepository.over(runner(db)), cfg, LONG, () => mkConn(db, sf));
  let threw = false;
  try { await F.onModuleInit(); } catch { threw = true; }
  ok(!threw, 'start-up with an unreachable listener does not throw');
  ok(await F.isEntitled(A.company_id, CODE) === true, 'the service keeps answering from the database meanwhile');
  ok((await until(() => F.listening, 5000)) >= 0 && sf.connects === 1, 'it keeps retrying with backoff and connects once the database accepts it', JSON.stringify(sf));
  const G = new EntitlementService(EntitlementRepository.over(runner(db)), cfg, LONG, () => { throw new Error('factory exploded'); });
  threw = false; try { await G.onModuleInit(); await sleep(100); } catch { threw = true; }
  ok(!threw, 'even a failing connection factory does not crash start-up');
  const N = new EntitlementService(EntitlementRepository.over(runner(db)), cfg, LONG, null);
  await N.onModuleInit();
  ok(!N.listening && await N.isEntitled(A.company_id, CODE) === true, 'with the listener disabled (ENTITLEMENT_LISTEN=false) it works on TTL only');

  console.log('\n[6] shutdown');
  for (const s of [X, Y, Z, F, G, N]) await s.onModuleDestroy();
  ok(!X.listening && !Y.listening && !Z.listening, 'listeners are closed on shutdown');
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
