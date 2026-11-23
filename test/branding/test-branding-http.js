// Company Logo + Application Branding over HTTP: REAL BrandingController / BrandingService / CompanyController (logo routes) /
// CompanyLogoService / CompanyRepository (raw SQL) / FileStorageService / SuperAdminGuard / PermissionsGuard / multer,
// on PGlite (in-memory PostgreSQL) and a temporary upload folder. Only the authentication guard is replaced (reads the user
// from a header). Env: DIST (compiled backend), PGLITE (folder that contains @electric-sql/pglite).
require('reflect-metadata');
const fs = require('fs'), os = require('os'), path = require('path');
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');
const { getDataSourceToken } = require('@nestjs/typeorm');
const { UnauthorizedException } = require('@nestjs/common');
const { PGlite } = require(process.env.PGLITE);
const DIST = process.env.DIST;
const REQ = (p) => require(DIST + p);
const { BrandingController } = REQ('/modules/branding/branding.controller');
const { BrandingService } = REQ('/modules/branding/branding.service');
const { CompanyController } = REQ('/modules/company/presentation/company.controller');
const { CompanyLogoService } = REQ('/modules/company/application/services/company-logo.service');
const { CompanyRepository } = REQ('/modules/company/infrastructure/persistence/company.repository');
const { COMPANY_REPOSITORY_TOKEN } = REQ('/modules/company/domain/interfaces/company.repository.interface');
const { FileStorageService } = REQ('/common/storage/file-storage.service');
const { JwtAuthGuard } = REQ('/modules/auth/guards/jwt-auth.guard');
const { PermissionsGuard } = REQ('/modules/auth/guards/permissions.guard');
const { SuperAdminGuard } = REQ('/modules/auth/guards/super-admin.guard');
const { AuditLogInterceptor } = REQ('/modules/user/presentation/interceptors/audit-log.interceptor');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

// ---- test images (hand-built so no image library is needed)
const crc = (() => { const t = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; }); return (b) => { let c = -1; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }; })();
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = (w, h, extra = 0) => { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', Buffer.alloc(8 + extra, 1)), chunk('IEND', Buffer.alloc(0))]); };
const jpg = (w, h) => { const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]); return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]), sof, Buffer.alloc(40, 0), Buffer.from([0xff, 0xd9])]); };

const fakeJwt = { canActivate(ctx) { const r = ctx.switchToHttp().getRequest(); const h = r.headers['x-test-user']; if (!h) throw new UnauthorizedException(); r.user = JSON.parse(h); return true; } };

(async () => {
  // UPLOAD_ROOT = run against the ACTUAL configured storage folder instead of a temp folder. Safety: only when that folder is
  // empty (so every file in it was created by this test and is removed again); otherwise the test stops without touching it.
  const REAL = process.env.UPLOAD_ROOT || null;
  const dir = REAL || fs.mkdtempSync(path.join(os.tmpdir(), 'branding-'));
  if (REAL) {
    fs.mkdirSync(dir, { recursive: true });
    if (fs.readdirSync(dir).length) { console.log('REFUSING to run: the configured storage folder ' + dir + ' is not empty; this test only runs where it can clean up after itself.'); process.exit(3); }
    console.log('Running against the configured storage folder: ' + dir);
  }
  const db = new PGlite();
  await db.exec(`CREATE TABLE companies (company_id uuid PRIMARY KEY, company_name text, is_deleted boolean DEFAULT false, logo_path varchar(500), logo_mime varchar(50), logo_updated_at timestamp);
                 CREATE TABLE app_settings (setting_key varchar(100) PRIMARY KEY, setting_value jsonb, updated_at timestamp NOT NULL DEFAULT NOW(), updated_by uuid)`);
  const CA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', CB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', CX = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  await db.query(`INSERT INTO companies (company_id, company_name) VALUES ($1,'A'),($2,'B')`, [CA, CB]);
  const q = async (s, p) => (await db.query(s, p || [])).rows;
  const fakeTypeormRepo = { query: q, findOne: async ({ where }) => { const r = (await q(`SELECT company_id FROM companies WHERE company_id=$1 AND is_deleted=false`, [where.companyId]))[0]; return r ? { companyId: r.company_id } : null; } };
  const SYSTEM = '00000000-0000-0000-0000-000000000000', SA_ID = '00000000-0000-0000-0000-000000000001';
  const appCfg = { uploadDir: dir, superAdmin: { userId: SA_ID, username: 'superadmin', email: 'superadmin@medi-waste.io' } };
  const cfg = { get: (k) => (k === 'app' ? appCfg : k === 'app.uploadDir' ? dir : undefined) };
  const stub = (p, n) => ({ provide: REQ(p)[n], useValue: {} });
  const boot = async () => {
  const mod = await Test.createTestingModule({
    controllers: [BrandingController, CompanyController],
    providers: [
      { provide: ConfigService, useValue: cfg }, FileStorageService, BrandingService, CompanyLogoService,
      { provide: getDataSourceToken('master'), useValue: { query: q } },
      { provide: COMPANY_REPOSITORY_TOKEN, useValue: new CompanyRepository(fakeTypeormRepo) },
      { provide: AuditLogInterceptor, useValue: { intercept: (c, n) => n.handle() } },
      stub('/modules/company/application/use-cases/create-company.use-case', 'CreateCompanyUseCase'), stub('/modules/company/application/use-cases/get-company.use-case', 'GetCompanyUseCase'),
      stub('/modules/company/application/use-cases/get-all-companies.use-case', 'GetAllCompaniesUseCase'), stub('/modules/company/application/use-cases/update-company.use-case', 'UpdateCompanyUseCase'),
      stub('/modules/company/application/use-cases/delete-company.use-case', 'DeleteCompanyUseCase'), PermissionsGuard, SuperAdminGuard,
    ],
  }).overrideGuard(JwtAuthGuard).useValue(fakeJwt).compile();
  const app = mod.createNestApplication(); app.setGlobalPrefix('api/v1'); await app.listen(0);
  return { app, base: `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1` };
  };
  let app, base;
  ({ app, base } = await boot());
  const U = (o) => JSON.stringify({ userId: 'u-' + Math.random().toString(16).slice(2, 10) + '-0000-4000-8000-000000000000'.slice(0, 0), ...o });
  const SUPER = JSON.stringify({ userId: SA_ID, userName: 'superadmin', email: 'superadmin@medi-waste.io', companyId: SYSTEM, permissions: ['*'] });
  const SUPER_OTP = JSON.stringify({ userId: SA_ID, userName: 'superadmin', email: 'superadmin@medi-waste.io', companyId: SYSTEM }); // token of the OTP login path carries no permissions
  const adminA = JSON.stringify({ userId: 'a1111111-1111-4111-8111-111111111111', userName: 'adminA', companyId: CA, permissions: ['COMPANY_VIEW', 'COMPANY_EDIT'] });
  const viewerA = JSON.stringify({ userId: 'a2222222-2222-4222-8222-222222222222', userName: 'viewerA', companyId: CA, permissions: ['COMPANY_VIEW'] });
  const adminB = JSON.stringify({ userId: 'b1111111-1111-4111-8111-111111111111', userName: 'adminB', companyId: CB, permissions: ['COMPANY_VIEW', 'COMPANY_EDIT'] });
  const impostor = JSON.stringify({ userId: 'c1111111-1111-4111-8111-111111111111', userName: 'superadmin', email: 'superadmin@medi-waste.io', companyId: CA, permissions: ['COMPANY_VIEW', 'COMPANY_EDIT'] });
  const call = async (method, p, user, file, extra) => {
    const init = { method, headers: user ? { 'x-test-user': user } : {} };
    if (file) { const fd = new FormData(); fd.append('file', new Blob([file.buf], { type: file.type }), file.name); init.body = fd; }
    const r = await fetch(base + p, init); const buf = Buffer.from(await r.arrayBuffer()); let body = null; try { body = JSON.parse(buf.toString()); } catch { /* binary */ }
    return { status: r.status, body, buf, h: r.headers };
  };
  const files = () => { const out = []; const walk = (d) => { for (const f of fs.existsSync(d) ? fs.readdirSync(d) : []) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : out.push(path.relative(dir, p).split(path.sep).join('/')); } }; walk(dir); return out.sort(); };
  const P1 = { buf: png(64, 32), type: 'image/png', name: 'logo.png' };

  console.log('[1] Application Branding: who may change it');
  let r = await call('GET', '/branding/app-logo/meta');
  ok(r.status === 200 && r.body.data.hasLogo === false && r.body.data.url === null, 'public meta: no logo configured yet');
  r = await call('GET', '/branding/app-logo'); ok(r.status === 404, 'public logo: 404 when none is configured');
  r = await call('POST', '/branding/app-logo', undefined, P1); ok(r.status === 401, 'upload without a login -> 401');
  r = await call('POST', '/branding/app-logo', adminA, P1); ok(r.status === 403, 'customer admin (even with COMPANY_EDIT) -> 403');
  r = await call('POST', '/branding/app-logo', impostor, P1); ok(r.status === 403, 'a customer user NAMED "superadmin" (same e-mail/username) -> 403 (identity needs the system company)');
  r = await call('DELETE', '/branding/app-logo', adminA); ok(r.status === 403, 'customer admin cannot remove it');
  ok(files().length === 0, 'nothing was written by any refused request');
  r = await call('POST', '/branding/app-logo', SUPER, P1); ok(r.status === 201 && r.body.data.hasLogo && /^\/branding\/app-logo\?v=\d+$/.test(r.body.data.url), 'SuperAdmin upload -> 201 with a versioned URL', JSON.stringify(r.body));
  const v1 = r.body.data.version;
  const firstFiles = files(); ok(firstFiles.length === 1 && /^branding\/app-logo-[0-9a-f]{12}\.png$/.test(firstFiles[0]), 'stored under branding/ with a content-hash file name (never the client file name)', firstFiles.join());
  r = await call('GET', '/branding/app-logo'); ok(r.status === 200 && r.h.get('content-type') === 'image/png' && r.buf.equals(P1.buf), 'public retrieval returns the exact bytes as image/png');
  ok(r.h.get('x-content-type-options') === 'nosniff' && /default-src 'none'/.test(r.h.get('content-security-policy')), 'served with nosniff and a locked-down Content-Security-Policy');
  r = await call('GET', '/branding/app-logo/meta'); ok(r.body.data.hasLogo && r.body.data.version === v1, 'meta reports the logo and its version');
  const rows = await q(`SELECT setting_key, setting_value->>'path' AS p, updated_by FROM app_settings`);
  ok(rows.length === 1 && rows[0].setting_key === 'application_logo' && rows[0].p === firstFiles[0] && rows[0].updated_by === SA_ID, 'persisted in app_settings as a RELATIVE path with the uploader recorded');
  await new Promise((s) => setTimeout(s, 15));
  r = await call('POST', '/branding/app-logo', SUPER_OTP, { buf: jpg(120, 40), type: 'image/jpeg', name: 'new.JPG' });
  ok(r.status === 201 && r.body.data.version > v1, 'SuperAdmin of the OTP login path (token without permissions) can replace it; version changes');
  const f2 = files(); ok(f2.length === 1 && f2[0].endsWith('.jpg') && f2[0] !== firstFiles[0], 'replacement: the old file is removed, exactly one file remains');
  r = await call('GET', '/branding/app-logo'); ok(r.h.get('content-type') === 'image/jpeg', 'the new logo is served');

  console.log('\n[2] upload validation (type, size, content)');
  const bad = async (name, file, status, fragment) => { const x = await call('POST', '/branding/app-logo', SUPER, file); ok(x.status === status && (!fragment || JSON.stringify(x.body).toLowerCase().includes(fragment)), name, `${x.status} ${JSON.stringify(x.body).slice(0, 120)}`); };
  await bad('GIF is refused (type)', { buf: Buffer.from('GIF89a....'), type: 'image/gif', name: 'x.gif' }, 400, 'unsupported');
  await bad('extension and declared MIME disagree', { buf: png(10, 10), type: 'image/jpeg', name: 'x.png' }, 400, 'does not match');
  await bad('.png whose bytes are a JPEG', { buf: jpg(10, 10), type: 'image/png', name: 'x.png' }, 400, 'not a valid image');
  await bad('.jpg whose bytes are a PNG', { buf: png(10, 10), type: 'image/jpeg', name: 'x.jpg' }, 400, 'not a valid image');
  await bad('executable renamed .png', { buf: Buffer.from('MZ\x90\x00 fake exe ' + 'x'.repeat(50)), type: 'image/png', name: 'evil.png' }, 400, 'not a valid image');
  await bad('HTML renamed .svg', { buf: Buffer.from('<html><script>alert(1)</script></html>'), type: 'image/svg+xml', name: 'x.svg' }, 400);
  await bad('PNG larger than 4000 px', { buf: png(5000, 100), type: 'image/png', name: 'big.png' }, 400, '4000');
  await bad('JPEG larger than 4000 px', { buf: jpg(100, 4100), type: 'image/jpeg', name: 'big.jpg' }, 400, '4000');
  await bad('PNG with a zero-size header', { buf: png(0, 0), type: 'image/png', name: 'z.png' }, 400);
  await bad('truncated PNG (signature only)', { buf: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), type: 'image/png', name: 't.png' }, 400);
  await bad('file over 2 MB -> 413 from the upload limit', { buf: png(50, 50, 2 * 1024 * 1024 + 10), type: 'image/png', name: 'huge.png' }, 413);
  await bad('empty file', { buf: Buffer.alloc(0), type: 'image/png', name: 'e.png' }, 400);
  await bad('no extension', { buf: png(10, 10), type: 'image/png', name: 'logo' }, 400, 'unsupported');
  const noField = await fetch(base + '/branding/app-logo', { method: 'POST', headers: { 'x-test-user': SUPER }, body: (() => { const fd = new FormData(); fd.append('other', 'x'); return fd; })() });
  ok(noField.status === 400, 'request without the "file" field -> 400');
  ok(files().length === 1, 'refused uploads left no files behind');
  const evil = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)" width="40" height="40"><script>alert(2)</script><foreignObject><div onclick="x()">x</div></foreignObject><a xlink:href="javascript:alert(3)"><rect width="40" height="40" onmouseover="alert(4)" style="fill:red"/></a><use href="http://evil.example/x.svg#a"/><image href="http://evil.example/p.png"/><circle cx="5" cy="5" r="5"/></svg>';
  r = await call('POST', '/branding/app-logo', SUPER, { buf: Buffer.from(evil), type: 'image/svg+xml', name: 'logo.svg' });
  ok(r.status === 201, 'a hostile SVG is accepted only after sanitising');
  r = await call('GET', '/branding/app-logo'); const svg = r.buf.toString();
  ok(r.h.get('content-type') === 'image/svg+xml' && /<svg/.test(svg) && /<circle/.test(svg), 'the harmless drawing survives');
  ok(!/<script|onload|onclick|onmouseover|foreignObject|javascript:|evil\.example|<use|<image|<a[ >]|style=/i.test(svg), 'scripts, event handlers, foreignObject, links, external references and styles are all removed', svg.slice(0, 300));
  await call('POST', '/branding/app-logo', SUPER, P1);

  console.log('\n[3] Company Logo');
  r = await call('POST', `/companies/${CA}/logo`, adminA, P1); ok(r.status === 201 && /^\/companies\/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\/logo\?v=\d+$/.test(r.body.data.logoUrl), 'own company: upload by a user with COMPANY_EDIT');
  const cf = files().filter((f) => f.startsWith('companies/')); ok(cf.length === 1 && cf[0].startsWith(`companies/${CA}/logo-`), 'stored in the company\'s own folder', cf.join());
  const row = (await q(`SELECT logo_path, logo_mime FROM companies WHERE company_id=$1`, [CA]))[0]; ok(row.logo_path === cf[0] && row.logo_mime === 'image/png' && !path.isAbsolute(row.logo_path), 'association: the company row holds a relative path and the MIME type');
  ok(!(await q(`SELECT logo_path FROM companies WHERE company_id=$1`, [CB]))[0].logo_path, 'another company is not affected');
  r = await call('GET', `/companies/${CA}/logo`, viewerA); ok(r.status === 200 && r.buf.equals(P1.buf) && /private/.test(r.h.get('cache-control')), 'retrieval by a user with COMPANY_VIEW of the same company (private cache)');
  r = await call('GET', `/companies/${CA}/logo`); ok(r.status === 401, 'retrieval without a login -> 401');
  r = await call('POST', `/companies/${CA}/logo`, viewerA, P1); ok(r.status === 403, 'COMPANY_VIEW alone cannot upload (RBAC unchanged)');
  r = await call('POST', `/companies/${CB}/logo`, adminA, P1); ok(r.status === 403 && /your own company/.test(JSON.stringify(r.body)), 'another customer\'s company: upload refused');
  r = await call('DELETE', `/companies/${CB}/logo`, adminA); ok(r.status === 403, 'another customer\'s company: removal refused');
  r = await call('GET', `/companies/${CB}/logo`, adminA); ok(r.status === 403, 'another customer\'s company: retrieval refused');
  r = await call('POST', `/companies/${CB}/logo`, adminB, { buf: jpg(80, 80), type: 'image/jpeg', name: 'b.jpg' }); ok(r.status === 201, 'company B uploads its own logo');
  ok(files().filter((f) => f.startsWith('companies/')).length === 2, 'each company has its own file');
  r = await call('GET', `/companies/${CA}/logo`, adminB); ok(r.status === 403, 'B cannot read A\'s logo');
  r = await call('GET', `/companies/${CB}/logo`, adminB); ok(r.h.get('content-type') === 'image/jpeg', 'B reads its own (its own type)');
  r = await call('POST', `/companies/${CA}/logo`, SUPER, { buf: png(20, 20, 5), type: 'image/png', name: 'r.png' }); ok(r.status === 201, 'SuperAdmin replaces company A\'s logo');
  const cf2 = files().filter((f) => f.startsWith(`companies/${CA}/`)); ok(cf2.length === 1 && cf2[0] !== cf[0], 'replacement removed only A\'s previous file');
  ok(files().filter((f) => f.startsWith(`companies/${CB}/`)).length === 1, 'B\'s file untouched by A\'s replacement');
  r = await call('POST', `/companies/${CX}/logo`, SUPER, P1); ok(r.status === 404, 'unknown company -> 404 and no file written');
  ok(!files().some((f) => f.includes(CX)), 'nothing stored for the unknown company');
  r = await call('POST', '/companies/not-a-uuid/logo', SUPER, P1); ok(r.status === 400, 'malformed company id -> 400');
  r = await call('POST', `/companies/${CA}/logo`, adminA, { buf: png(10, 10), type: 'image/png', name: '../../../../evil.png' }); ok(r.status === 201 && files().every((f) => !f.includes('evil') && !f.startsWith('..')), 'a path-traversal file name is ignored: the stored name is generated');
  r = await call('DELETE', `/companies/${CA}/logo`, adminA); ok(r.status === 200, 'own company: removal');
  ok(!(await q(`SELECT logo_path FROM companies WHERE company_id=$1`, [CA]))[0].logo_path && !files().some((f) => f.startsWith(`companies/${CA}/`)), 'removal clears the column and deletes only that company\'s file');
  r = await call('GET', `/companies/${CA}/logo`, adminA); ok(r.status === 404, 'retrieval after removal -> 404');

  console.log('\n[4] storage safety');
  const fsvc = new FileStorageService(cfg);
  let blocked = 0; for (const p of ['../../etc/passwd', '..\\..\\secret.txt', 'branding/../../../x', '/etc/passwd', 'C:\\Windows\\win.ini']) { try { await fsvc.read(p); } catch (e) { if (e.status === 404) blocked++; } }
  ok(blocked === 5, 'reading outside the upload root is refused for 5 traversal / absolute paths', String(blocked));
  fs.writeFileSync(path.join(os.tmpdir(), 'branding-outside.txt'), 'x'); await fsvc.deleteFile('../branding-outside.txt');
  ok(fs.existsSync(path.join(os.tmpdir(), 'branding-outside.txt')), 'deleting outside the upload root is refused (file survives)');
  fs.unlinkSync(path.join(os.tmpdir(), 'branding-outside.txt'));

  console.log('\n[5] persistence after a backend restart, missing files, permissions');
  const keepA = (await call('GET', '/branding/app-logo')).buf; const keepB = (await call('GET', `/companies/${CB}/logo`, adminB)).buf;
  ok(keepA.length > 0 && keepB.length > 0, 'before the restart both logos are served');
  await app.close(); ({ app, base } = await boot());
  r = await call('GET', '/branding/app-logo'); ok(r.status === 200 && r.buf.equals(keepA), 'after a restart (new application instance, same database and upload folder) the application logo is still served');
  r = await call('GET', `/companies/${CB}/logo`, adminB); ok(r.status === 200 && r.buf.equals(keepB), 'and the logo of company B');
  r = await call('GET', '/branding/app-logo/meta'); ok(r.body.data.hasLogo === true, 'meta unchanged after the restart');
  const bFile = files().find((f) => f.startsWith(`companies/${CB}/`)); fs.unlinkSync(path.join(dir, bFile));
  r = await call('GET', `/companies/${CB}/logo`, adminB); ok(r.status === 404, 'company logo whose file vanished from disk -> clean 404 (callers fall back)');
  ok((await call('GET', `/companies/${CB}`, adminB)).status !== 500, 'the company itself still loads');
  const aFile = files().find((f) => f.startsWith('branding/')); fs.unlinkSync(path.join(dir, aFile));
  r = await call('GET', '/branding/app-logo'); ok(r.status === 404, 'application logo whose file vanished -> clean 404 (the UI keeps the default mark)');
  r = await call('POST', '/branding/app-logo', SUPER, P1); ok(r.status === 201, 'and a new upload repairs it');
  if (process.platform !== 'win32') { const st = fs.statSync(path.join(dir, files().find((f) => f.startsWith('branding/')))); ok((st.mode & 0o777) === 0o640, 'uploaded files are 0640 (never executable, never world-readable)', (st.mode & 0o777).toString(8)); } else console.log('  (file mode check skipped on Windows)');
  const lsvc = new CompanyLogoService({ getEntityById: async () => ({}), getLogoInfo: async () => ({ logoPath: 'companies/zzz/none.png', logoMime: 'image/png', logoUpdatedAt: new Date() }) }, new FileStorageService(cfg));
  ok(await lsvc.getLogoDataUri('zzz') === undefined, 'document generation: a logo that cannot be read yields "no logo" instead of an error');

  console.log('\n[6] who may manage Application Branding: GET /branding/access and the write endpoints agree');
  const wildcard = JSON.stringify({ userId: 'd1111111-1111-4111-8111-111111111111', userName: 'ops-admin', email: 'ops@customer.example', companyId: CA, permissions: ['*'] });
  const wildcardSystem = JSON.stringify({ userId: 'd2222222-2222-4222-8222-222222222222', userName: 'root2', email: 'root2@medi-waste.io', companyId: SYSTEM, permissions: ['*'], roles: ['superadmin'] });
  const acc = async (u) => { const x = await call('GET', '/branding/access', u); return { status: x.status, can: x.body && x.body.data && x.body.data.canManageBranding }; };
  let a = await acc(undefined); ok(a.status === 401, 'access: anonymous -> 401');
  a = await acc(SUPER); ok(a.status === 200 && a.can === true, 'access: the designated SuperAdmin -> true');
  a = await acc(SUPER_OTP); ok(a.can === true, 'access: SuperAdmin whose token has no permissions list (OTP login) -> true');
  a = await acc(adminA); ok(a.status === 200 && a.can === false, 'access: customer administrator -> false');
  a = await acc(impostor); ok(a.can === false, 'access: customer user named "superadmin" -> false');
  a = await acc(wildcard); ok(a.status === 200 && a.can === false, 'access: a NON-SuperAdmin account holding the wildcard permission "*" -> false');
  a = await acc(wildcardSystem); ok(a.can === false, 'access: wildcard + superadmin role name, but not the designated identity -> false');
  const before6 = files().join('|');
  for (const [who, name] of [[wildcard, 'wildcard account'], [wildcardSystem, 'wildcard + superadmin role'], [adminA, 'customer admin'], [impostor, 'impostor']]) {
    const up = await call('POST', '/branding/app-logo', who, P1); const del = await call('DELETE', '/branding/app-logo', who);
    ok(up.status === 403 && del.status === 403, `write endpoints agree: ${name} cannot upload or remove the application logo (403/403)`, `${up.status}/${del.status}`);
  }
  ok(files().join('|') === before6, 'no file was created, replaced or removed by those refused requests');

  console.log('\n[7] corrupt files, unauthorized file modification, isolation between companies');
  r = await call('POST', `/companies/${CA}/logo`, adminA, P1); const aPath = files().find((f) => f.startsWith(`companies/${CA}/`));
  fs.writeFileSync(path.join(dir, aPath), Buffer.from('this is no longer an image'));
  r = await call('GET', `/companies/${CA}/logo`, adminA); ok(r.status === 404, 'a corrupt company logo file is treated as "no logo" (404), the bytes are never served');
  ok((await call('GET', `/companies/${CA}`, adminA)).status !== 500 && (await call('GET', '/branding/app-logo/meta')).status === 200, 'the application keeps working around it');
  const lsvc2 = new CompanyLogoService(new CompanyRepository(fakeTypeormRepo), new FileStorageService(cfg));
  ok(await lsvc2.getLogoDataUri(CA) === undefined, 'documents: a corrupt logo yields "no logo" (placeholder), never a broken image');
  r = await call('POST', `/companies/${CA}/logo`, adminA, P1); ok(r.status === 201 && (await call('GET', `/companies/${CA}/logo`, adminA)).status === 200, 'uploading a valid logo repairs it');
  const appFile = files().find((f) => f.startsWith('branding/')); fs.writeFileSync(path.join(dir, appFile), Buffer.alloc(0));
  r = await call('GET', '/branding/app-logo'); ok(r.status === 404, 'an empty (0-byte) application logo file -> 404, the UI keeps the default mark');
  await call('POST', '/branding/app-logo', SUPER, P1);
  // identical bytes for two companies: separate files, independent lifetimes
  await call('POST', `/companies/${CA}/logo`, adminA, P1); await call('POST', `/companies/${CB}/logo`, adminB, P1);
  const fa = files().filter((f) => f.startsWith(`companies/${CA}/`)), fb = files().filter((f) => f.startsWith(`companies/${CB}/`));
  ok(fa.length === 1 && fb.length === 1 && fa[0].split('/')[2] === fb[0].split('/')[2] && fa[0] !== fb[0], 'two companies uploading the SAME image get two separate files (same hash name, different company folders)');
  await call('DELETE', `/companies/${CA}/logo`, adminA);
  r = await call('GET', `/companies/${CB}/logo`, adminB); ok(r.status === 200 && r.buf.equals(P1.buf), 'removing A\'s logo does not touch B\'s identical image');
  const snapshot = () => files().map((f) => `${f}:${require('crypto').createHash('sha1').update(fs.readFileSync(path.join(dir, f))).digest('hex')}`).join('|');
  await call('POST', `/companies/${CA}/logo`, adminA, { buf: png(33, 33, 7), type: 'image/png', name: 'a2.png' });
  const snap0 = snapshot();
  const refused = [];
  refused.push(await call('POST', `/companies/${CA}/logo`, undefined, P1));                       // anonymous
  refused.push(await call('POST', `/companies/${CA}/logo`, adminB, { buf: jpg(50, 50), type: 'image/jpeg', name: 'x.jpg' })); // other company: overwrite A
  refused.push(await call('DELETE', `/companies/${CA}/logo`, adminB));                              // other company: delete A
  refused.push(await call('POST', `/companies/${CA}/logo`, viewerA, P1));                          // view-only
  refused.push(await call('DELETE', `/companies/${CA}/logo`, viewerA));
  refused.push(await call('POST', '/branding/app-logo', adminA, P1));                              // app logo by a customer
  refused.push(await call('POST', `/companies/${CA}/logo`, adminA, { buf: Buffer.from('<script>'), type: 'image/png', name: 'bad.png' })); // invalid content
  ok(refused.map((x) => x.status).join(',') === '401,403,403,403,403,403,400', 'refused / rejected with 401, 403 or 400 as expected', refused.map((x) => x.status).join(','));
  ok(snapshot() === snap0, 'after all refused requests every stored file is byte-for-byte unchanged (nothing overwritten, deleted or added)');

  console.log('\n[8] an unusable storage folder never crashes the application');
  const blocker = path.join(os.tmpdir(), 'branding-not-a-folder-' + process.pid); fs.writeFileSync(blocker, 'x');
  const badCfg = { get: (k) => (k === 'app.uploadDir' ? path.join(blocker, 'uploads') : cfg.get(k)) };
  const badStorage = new FileStorageService(badCfg);
  let threw = false; try { await badStorage.onModuleInit(); } catch { threw = true; }
  ok(!threw, 'start-up self-check of an unusable folder logs an error but does not throw');
  const badLogo = new CompanyLogoService(new CompanyRepository(fakeTypeormRepo), badStorage);
  let uploadFailed = false; try { await badLogo.upload(CB, { buffer: P1.buf, mimetype: 'image/png', originalname: 'x.png' }); } catch { uploadFailed = true; }
  ok(uploadFailed && (await q(`SELECT logo_path FROM companies WHERE company_id=$1`, [CB]))[0].logo_path === fb[0], 'an upload into an unusable folder fails cleanly and leaves the company\'s existing logo reference intact');
  ok(await badLogo.getLogoDataUri(CB) === undefined, 'document generation keeps working (no logo) when the folder is unusable');
  fs.unlinkSync(blocker);
  const probeStorage = new FileStorageService(cfg); await probeStorage.onModuleInit();
  ok(fs.existsSync(probeStorage.rootPath) && !fs.readdirSync(probeStorage.rootPath).some((f) => f.startsWith('.write-probe')), 'the start-up probe passed on the configured folder and left no probe file behind');
  try { fs.accessSync(probeStorage.rootPath, fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK); ok(true, `runtime account can read/write/search ${probeStorage.rootPath}`); } catch (e) { ok(false, 'runtime account permissions on the storage folder', e.message); }

  await app.close();
  if (REAL) { for (const e of fs.readdirSync(dir)) fs.rmSync(path.join(dir, e), { recursive: true, force: true }); } else { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n[C] a failed logo lookup is not cached (documents retry on the next generation)');
  { const st = new FileStorageService(cfg); const rel = await st.saveLogo('zz-cache-test', 'l', 'png', png(8, 8));
    let lookups = 0; const flaky = new CompanyLogoService({ getEntityById: async () => ({}), getLogoInfo: async () => { lookups++; if (lookups === 1) throw new Error('database hiccup'); return { logoPath: rel, logoMime: 'image/png', logoUpdatedAt: new Date() }; } }, st);
    ok(await flaky.getLogoDataUri('flaky') === undefined, 'lookup error -> document goes out without a logo (no exception)');
    const second = await flaky.getLogoDataUri('flaky');
    ok(typeof second === 'string' && second.startsWith('data:image/png;base64,') && lookups === 2, 'the next document retries and gets the logo (the failure was not cached)', String(lookups));
    await flaky.getLogoDataUri('flaky'); ok(lookups === 2, 'a successful lookup is cached briefly (no extra lookup)');
    await st.deleteFile(rel); fs.rmSync(path.join(dir, 'zz-cache-test'), { recursive: true, force: true }); }

  console.log('\n[R] UPLOAD_DIR spelling: trailing slash, forward slashes, "..", "." must all work (regression: containment check)');
  const spelled = fs.mkdtempSync(path.join(os.tmpdir(), 'branding-spell-'));
  const variants = { 'trailing slash': spelled + path.sep, 'forward slashes': spelled.split(path.sep).join('/'), 'with dot segments': path.join(spelled, 'sub', '..', '.') + path.sep, 'double separator': spelled + path.sep + path.sep };
  for (const [label, uploadDir] of Object.entries(variants)) {
    const svc = new FileStorageService({ get: (k) => (k === 'app.uploadDir' ? uploadDir : undefined) });
    let good = false, why = '';
    try { const rel = await svc.saveLogo('companies', 'x', 'png', Buffer.from('abc')); good = (await svc.read(rel)).toString() === 'abc' && fs.existsSync(path.join(spelled, rel)); await svc.deleteFile(rel); good = good && !fs.existsSync(path.join(spelled, rel)); } catch (e) { why = e.message; }
    ok(good, `storage root spelled with ${label}: save / read / delete work`, why);
  }
  let escaped = false; try { await new FileStorageService({ get: () => spelled + path.sep }).read('../../etc/passwd'); escaped = true; } catch { /* expected */ }
  ok(!escaped, 'path traversal is still refused with a trailing-slash root');
  fs.rmSync(spelled, { recursive: true, force: true });
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
