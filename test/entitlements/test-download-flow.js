// Complete bulk-download flow over HTTP: REAL InvoiceDownloadController, InvoiceBulkDownloadService, EntitlementService
// and ZIP files written with the REAL ZipGenerator, on PGlite. Ownership + entitlement are decided at DOWNLOAD time.
// Env: BE, DIST, PGT; NODE_PATH with pglite.
require('reflect-metadata');
const fs = require('fs'), os = require('os'), path = require('path');
const BE = process.env.BE, DIST = process.env.DIST;
const { Test } = require('@nestjs/testing');
const { JwtService } = require('@nestjs/jwt');
const { loadReal, build } = require(process.env.PGT + '/replica');
const { runAll, FILES } = require(BE + '/scripts/entitlements/run-migrations.js');
const REQ = (p) => require(DIST + p);
const { EntitlementRepository } = REQ('/modules/entitlement/infrastructure/entitlement.repository');
const { EntitlementService } = REQ('/modules/entitlement/application/entitlement.service');
const { InvoiceBulkDownloadService } = REQ('/modules/invoice/application/services/invoice-bulk-download.service');
const { InvoiceDownloadController } = REQ('/modules/invoice/presentation/invoice-download.controller');
const { AuthJwtService } = REQ('/modules/auth/services/jwt.service');
const { ZipGenerator } = REQ('/common/utils/zip-generator.util');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const runner = (db) => ({ async query(s, p) { return (await db.query(s, p || [])).rows; }, async transaction(w) { return db.transaction(async (tx) => w(runner(tx))); } });
const U = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

(async () => {
  const real = await loadReal(); const db = await build(real);
  const migr = await runAll({ client: { query: async (s, p) => (p ? db.query(s, p) : (await db.exec(s)).slice(-1)[0] || { rows: [] }) }, files: FILES.map(([id, f]) => [id, fs.readFileSync(`${BE}/migrations/${f}`, 'utf8')]), log: () => {} });
  if (!migr.ok) throw new Error('migration failed: ' + migr.reason);
  const [A, B] = real.companies.rows.filter((c) => !c.is_deleted);
  await db.exec(`DROP TABLE IF EXISTS invoices; CREATE TABLE invoices (invoice_id uuid PRIMARY KEY, company_id uuid)`);
  const [iA1, iA2, iB1] = [U(1), U(2), U(3)];
  await db.query(`INSERT INTO invoices VALUES ($1,$2),($3,$2),($4,$5)`, [iA1, A.company_id, iA2, iB1, B.company_id]);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zipflow-'));
  const mkZip = async (name, ids, withManifest = true) => {
    const files = ids.map((id, i) => ({ name: `INV-${i}.pdf`, buffer: Buffer.from('%PDF-fake-' + id) }));
    const buf = await ZipGenerator.generateZipFromBuffers(files, { includeManifest: withManifest, manifestData: withManifest ? ids.map((id, i) => ({ fileName: `INV-${i}.pdf`, invoiceId: id, invoiceNumber: 'N' + i, generatedAt: new Date().toISOString() })) : undefined, compressionLevel: 6 });
    const f = path.join(dir, name); fs.writeFileSync(f, buf); return f;
  };
  const files = {
    legacyA: await mkZip('legacyA.zip', [iA1, iA2]), legacyB: await mkZip('legacyB.zip', [iB1]), mixed: await mkZip('mixed.zip', [iA1, iB1]),
    unknownInv: await mkZip('unknown.zip', [iA1, U(99)]), noManifest: await mkZip('nomanifest.zip', [iA1], false), recordedA: await mkZip('recordedA.zip', [iA1]),
  };
  files.corrupt = path.join(dir, 'corrupt.zip'); fs.writeFileSync(files.corrupt, Buffer.from('this is not a zip file at all, just bytes'));
  files.truncated = path.join(dir, 'trunc.zip'); fs.writeFileSync(files.truncated, fs.readFileSync(files.legacyA).subarray(0, 40));
  const rec = (token, file, companyId) => ({ id: 'id-' + token, jobId: 'j-' + token, token, filePath: file, companyId, createdAt: new Date(), expireAt: new Date(Date.now() + 3600e3), downloadCount: 0, status: 'ACTIVE' });
  const RECS = [rec('legacyA', files.legacyA, null), rec('legacyB', files.legacyB, null), rec('mixed', files.mixed, null), rec('unknown', files.unknownInv, null), rec('nomanifest', files.noManifest, null),
    rec('corrupt', files.corrupt, null), rec('trunc', files.truncated, null), rec('recA', files.recordedA, A.company_id), rec('recB', files.legacyB, B.company_id)];
  RECS.push({ ...rec('expired', files.legacyA, null), expireAt: new Date(Date.now() - 1000) });
  const live = () => JSON.stringify(RECS.filter((r) => r.token !== 'expired')); // the pre-existing expiry bookkeeping marks the expired row EXPIRED; that is not part of this change
  const before = live();
  const fakeRepo = { findOne: async ({ where }) => RECS.find((r) => r.token === where.token) || null, save: async (r) => r, increment: async () => undefined, manager: { query: async (s, p) => (await db.query(s, p || [])).rows } };
  const svc = new InvoiceBulkDownloadService(fakeRepo);

  const appCfg = { superAdmin: { userId: '00000000-0000-0000-0000-000000000001', username: 'superadmin', email: 'superadmin@medi-waste.io' }, jwt: { secret: 'test-secret', expiresIn: '1h' } };
  const config = { get: (k) => (k === 'app' ? appCfg : k === 'app.jwt' ? appCfg.jwt : undefined) };
  const jwt = new AuthJwtService(new JwtService({}), config);
  const ent = new EntitlementService(EntitlementRepository.over(runner(db)), config, { flagsTtlMs: 0, modesTtlMs: 0, flushIntervalMs: 3600000 }, null, jwt);
  const mod = await Test.createTestingModule({ controllers: [InvoiceDownloadController], providers: [{ provide: InvoiceBulkDownloadService, useValue: svc }, { provide: EntitlementService, useValue: ent }] }).compile();
  const app = mod.createNestApplication(); app.setGlobalPrefix('api/v1'); await app.listen(0);
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;
  const get = async (token, bearer, route = 'download/bulk') => { const r = await fetch(`${base}/${route}/${token}`, { headers: bearer ? { authorization: `Bearer ${bearer}` } : {} }); const buf = Buffer.from(await r.arrayBuffer()); let body = null; try { body = JSON.parse(buf.toString()); } catch { /* binary */ } return { status: r.status, body, bytes: buf.length, type: r.headers.get('content-type') }; };
  const setModes = async (mode) => { await db.query(`UPDATE entitlement_settings SET setting_value=$1 WHERE setting_key IN ('mode','tenant_mode')`, [mode]); };
  const setFlag = (company, enabled) => db.query(`UPDATE company_entitlements SET is_enabled=$3 WHERE company_id=$1 AND entity_code=$2`, [company, 'FINANCE.INVOICE_MGMT.BULK_ZIP', enabled]);
  const tokenFor = (payload) => jwt.generateToken({ userRoleId: null, ...payload });
  const adminTok = await tokenFor({ userId: '00000000-0000-0000-0000-000000000001', userName: 'superadmin', companyId: '00000000-0000-0000-0000-000000000000', permissions: ['*'] });
  const custB = await tokenFor({ userId: U(50), userName: 'bob', companyId: B.company_id, permissions: ['INVOICE_VIEW'] });
  const len = (f) => fs.statSync(f).size;

  console.log('[1] ownership is established at download time (rollout modes OFF)');
  await setModes('OFF');
  let r = await get('legacyA'); ok(r.status === 200 && r.type === 'application/zip' && r.bytes === len(files.legacyA), 'legacy row, manifest lists only company A invoices: owner established from the ZIP, download works');
  r = await get('recA'); ok(r.status === 200, 'row with a recorded owner works');
  for (const [t, why] of [['mixed', 'invoices of two companies'], ['unknown', 'manifest lists an invoice that does not exist'], ['nomanifest', 'ZIP has no manifest'], ['corrupt', 'file is not a ZIP'], ['trunc', 'truncated ZIP']]) {
    r = await get(t); ok(r.status === 403 && r.body && r.body.code === 'DOWNLOAD_OWNER_UNVERIFIED' && /cannot be verified/.test(r.body.message), `legacy row, ${why}: refused with a clear message (not a 500)`, JSON.stringify([r.status, r.body]));
  }
  r = await get('mixed', custB); ok(r.status === 403, 'a customer (company B) Bearer token does not unlock a link that spans companies');
  r = await get('mixed', 'not.a.jwt'); ok(r.status === 403, 'an invalid Bearer token does not unlock it either');
  r = await get('mixed', adminTok); ok(r.status === 200 && r.bytes === len(files.mixed), 'SuperAdmin (Bearer) can still download an unverifiable/multi-company link');
  r = await get('corrupt', adminTok); ok(r.status === 200, 'SuperAdmin can download any existing file (existing authorization rules)');
  r = await get('expired'); ok(r.status === 410, 'expired links still answer 410');
  r = await get('no-such-token'); ok(r.status === 404, 'unknown token still answers 404');
  r = await get('legacyA', undefined, 'invoice-downloads'); ok(r.status === 200, 'the second route alias goes through the same checks');
  r = await get('mixed', undefined, 'invoice-downloads'); ok(r.status === 403, 'and refuses the same links');

  console.log('\n[2] entitlement is checked at download time (licensing ENFORCE)');
  await setModes('ENFORCE');
  r = await get('legacyA'); ok(r.status === 200, 'ENFORCE, company A entitled: legacy link works');
  await setFlag(A.company_id, false);
  r = await get('legacyA'); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED', 'ENFORCE, BULK_ZIP disabled for A: the legacy link (owner derived from the manifest) is refused');
  r = await get('recA'); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED', 'ENFORCE, BULK_ZIP disabled for A: the recorded-owner link is refused');
  r = await get('legacyB'); ok(r.status === 200, 'company B (still entitled) is unaffected by A being disabled');
  r = await get('recB'); ok(r.status === 200, 'B recorded link works');
  r = await get('legacyA', custB); ok(r.status === 403, 'cross-company: company B being entitled and sending its own Bearer does NOT open company A\'s file');
  r = await get('mixed', adminTok); ok(r.status === 200, 'SuperAdmin is not licensed away');
  await setFlag(A.company_id, true);
  await db.query(`UPDATE company_entitlements SET is_enabled=false WHERE company_id=$1 AND entity_code='FINANCE'`, [A.company_id]);
  r = await get('legacyA'); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED', 'the whole Finance module disabled for A also refuses the link');
  await db.query(`UPDATE company_entitlements SET is_enabled=true WHERE company_id=$1 AND entity_code='FINANCE'`, [A.company_id]);
  await setFlag(B.company_id, false);
  r = await get('legacyB'); ok(r.status === 403, 'B disabled: B\'s legacy link refused');
  r = await get('legacyA'); ok(r.status === 200, 'while A\'s link keeps working');
  await setFlag(B.company_id, true);
  r = await get('mixed'); ok(r.status === 403 && r.body.code === 'DOWNLOAD_OWNER_UNVERIFIED', 'the unverifiable link stays refused in ENFORCE too');

  console.log('\n[3] nothing is changed or deleted');
  ok(live() === before, 'no download record was modified (legacy rows keep companyId null; ownership is only derived, never written)');
  ok(Object.values(files).every((f) => fs.existsSync(f)), 'every ZIP file still exists');
  ok((await db.query(`SELECT count(*)::int n FROM invoices`)).rows[0].n === 3, 'invoices untouched');
  await app.close(); fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
