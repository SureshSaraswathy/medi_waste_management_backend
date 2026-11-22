// Disabled channel is refused AT LOGIN (before any token): HTTP level, real AuthController / LoginUseCase /
// HCFLoginUseCase / ValidationPipe and the REAL EntitlementService (as the CHANNEL_LOGIN_POLICY) over PGlite.
// Env: BE, DIST, PGT; NODE_PATH with pglite.
require('reflect-metadata');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const BE = process.env.BE, DIST = process.env.DIST;
const { Test } = require('@nestjs/testing');
const { JwtService } = require('@nestjs/jwt');
const { ValidationPipe } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { getDataSourceToken } = require('@nestjs/typeorm');
const { loadReal, build } = require(process.env.PGT + '/replica');
const { runAll, FILES } = require(BE + '/scripts/entitlements/run-migrations.js');
const REQ = (p) => require(DIST + p);
const { EntitlementRepository } = REQ('/modules/entitlement/infrastructure/entitlement.repository');
const { EntitlementService } = REQ('/modules/entitlement/application/entitlement.service');
const { AuthController } = REQ('/modules/auth/presentation/auth.controller');
const { HCFAuthController } = REQ('/modules/hcf-auth/presentation/hcf-auth.controller');
const { LoginUseCase } = REQ('/modules/auth/application/use-cases/login.use-case');
const { HCFLoginUseCase } = REQ('/modules/hcf-auth/application/use-cases/hcf-login.use-case');
const { AuthJwtService } = REQ('/modules/auth/services/jwt.service');
const { CHANNEL_LOGIN_POLICY } = REQ('/modules/auth/application/channel-login-policy');
const { UserEntity } = REQ('/modules/user/infrastructure/persistence/user.entity');
const { EmailService } = REQ('/modules/auth/services/email.service');
const { OtpService } = REQ('/modules/auth/services/otp.service');
const { PermissionService } = REQ('/modules/auth/services/permission.service');
const { JwtAuthGuard } = REQ('/modules/auth/guards/jwt-auth.guard');
const { PermissionsGuard } = REQ('/modules/auth/guards/permissions.guard');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const runner = (db) => ({ async query(s, p) { return (await db.query(s, p || [])).rows; }, async transaction(w) { return db.transaction(async (tx) => w(runner(tx))); } });

(async () => {
  const real = await loadReal(); const db = await build(real);
  const migr = await runAll({ client: { query: async (s, p) => (p ? db.query(s, p) : (await db.exec(s)).slice(-1)[0] || { rows: [] }) }, files: FILES.map(([id, f]) => [id, fs.readFileSync(`${BE}/migrations/${f}`, 'utf8')]), log: () => {} });
  if (!migr.ok) throw new Error('migration failed: ' + migr.reason);
  const [A, B] = real.companies.rows.filter((c) => !c.is_deleted);
  const SA_ID = '00000000-0000-0000-0000-000000000001';
  const appCfg = (otp) => ({ superAdmin: { username: 'superadmin', password: 'admin123', staticOtp: '123456', userId: SA_ID, email: 'superadmin@medi-waste.io' }, otp: { enabled: otp }, jwt: { secret: 'test-secret', expiresIn: '1h' } });
  const cfgWith = (otp) => ({ get: (k) => (k === 'app' ? appCfg(otp) : k === 'app.jwt' ? appCfg(otp).jwt : undefined) });
  const jwtService = new AuthJwtService(new JwtService({}), cfgWith(false));
  const ent = new EntitlementService(EntitlementRepository.over(runner(db)), cfgWith(false), { flagsTtlMs: 0, modesTtlMs: 0, flushIntervalMs: 3600000 }, null, jwtService);

  let owner = A.company_id; // which customer the test user / HCF belongs to
  let perms = ['USER_VIEW'];
  const entity = () => ({ userId: 'a0000000-0000-4000-8000-000000000001', userName: 'alice', companyId: owner, userRoleId: 'r1', status: 'Active' });
  const domainUser = () => ({ ...entity(), passwordEnabled: true, passwordHash: 'h', otpEnabled: false, forceOtpOnNextLogin: false, temporaryPassword: null, temporaryPasswordExpiry: null });
  const hcf = () => ({ hcfId: 'b0000000-0000-4000-8000-000000000001', hcfCode: 'HCF001', companyId: owner, loginEnabled: true, status: 'Active', isDeleted: false, passwordHash: 'h', temporaryPassword: null, forcePasswordChange: false, contactEmail: 'h@x.com', lastLogin: null, isPasswordExpired: () => false, isTemporaryPasswordExpired: () => false });
  const knownUser = { v: true };
  const ds = { getRepository: (E) => { const isUser = E === UserEntity; const qb = { where() { return qb; }, andWhere() { return qb; }, innerJoin() { return qb; }, select() { return qb; }, getOne: async () => (isUser && knownUser.v ? entity() : null) }; return { createQueryBuilder: () => qb, findOne: async () => (isUser ? (knownUser.v ? entity() : null) : { emailAddress: 'alice@x.com' }) }; } };
  const passwordService = { comparePassword: async (p) => p === 'pw', isTemporaryPasswordExpired: () => false };
  const permissionService = { loadUserPermissions: async () => perms };
  const userRepository = { findByUserName: async () => domainUser(), findById: async () => domainUser() };
  const hcfRepository = { findByCode: async () => hcf(), findByCodeOrEmail: async () => hcf(), findById: async () => hcf(), update: async () => hcf() };
  const otpMailed = [];

  const mkApp = async (otp) => {
    const login = new LoginUseCase(userRepository, hcfRepository, passwordService, jwtService, permissionService, ds, cfgWith(otp), ent);
    const hcfLogin = new HCFLoginUseCase(hcfRepository, passwordService, jwtService, { loadUserPermissions: async () => [] }, ent);
    const UC = '/modules/hcf-auth/application/use-cases/';
    const others = [['admin-reset-hcf-password.use-case', 'AdminResetHCFPasswordUseCase'], ['request-hcf-password-reset.use-case', 'RequestHCFPasswordResetUseCase'], ['reset-hcf-password-with-token.use-case', 'ResetHCFPasswordWithTokenUseCase'], ['change-hcf-password.use-case', 'ChangeHCFPasswordUseCase']].map(([p, n]) => ({ provide: REQ(UC + p)[n], useValue: {} }));
    const m = await Test.createTestingModule({ controllers: [AuthController, HCFAuthController], providers: [
      { provide: LoginUseCase, useValue: login }, { provide: ConfigService, useValue: cfgWith(otp) }, { provide: EmailService, useValue: { sendOtpEmail: async () => otpMailed.push(1) } },
      { provide: OtpService, useValue: { verifyOTP: () => ({ valid: true }) } }, { provide: AuthJwtService, useValue: jwtService }, { provide: PermissionService, useValue: permissionService },
      { provide: getDataSourceToken('master'), useValue: ds }, { provide: HCFLoginUseCase, useValue: hcfLogin }, { provide: CHANNEL_LOGIN_POLICY, useValue: ent }, JwtAuthGuard, PermissionsGuard, ...others] }).compile();
    const app = m.createNestApplication(); app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    await app.listen(0);
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;
    const post = async (p, body) => { const r = await fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); let j = null; try { j = await r.json(); } catch { /* none */ } return { status: r.status, body: j, token: j && j.data && j.data.token }; };
    return { app, post };
  };
  const plain = await mkApp(false), withOtp = await mkApp(true);
  const setModes = (mode) => db.query(`UPDATE entitlement_settings SET setting_value=$1 WHERE setting_key='mode'`, [mode]);
  const setFlag = (company, code, enabled) => db.query(`UPDATE company_entitlements SET is_enabled=$3 WHERE company_id=$1 AND entity_code=$2`, [company, code, enabled]);
  const MOBILE = { usernameOrEmail: 'alice', password: 'pw', channel: 'mobile' };
  const DESKTOP = { usernameOrEmail: 'alice', password: 'pw' };
  const HCF = { usernameOrEmail: 'HCF001', password: 'pw' };

  console.log('[1] Mobile App disabled (licensing ENFORCE)');
  await setModes('ENFORCE'); await setFlag(A.company_id, 'MOBILE_APP', false);
  let r = await plain.post('/auth/login', MOBILE);
  ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED' && /Mobile App is not enabled/.test(r.body.message) && !r.token && !JSON.stringify(r.body).includes('eyJ'), 'POST /auth/login channel=mobile -> 403 with a clear message and NO token', JSON.stringify(r.body).slice(0, 150));
  r = await plain.post('/auth/login', DESKTOP); ok(r.status === 200 && jwt.verify(r.token, 'test-secret').channel === 'DESKTOP', 'the same user on the desktop login still gets a desktop token');
  r = await plain.post('/auth/login', { ...MOBILE, password: 'wrong' }); ok(r.status === 401, 'wrong password on the mobile login -> 401 (the licence state is not revealed without valid credentials)');
  r = await withOtp.post('/auth/login', MOBILE); ok(r.status === 403 && otpMailed.length === 0, 'with OTP enabled the refusal comes BEFORE any OTP is sent');
  r = await withOtp.post('/auth/verify-otp', { usernameOrEmail: 'alice', otp: '123456', channel: 'mobile' }); ok(r.status === 403 && !r.token, 'POST /auth/verify-otp channel=mobile -> 403 (disabled meanwhile), no token');
  r = await withOtp.post('/auth/verify-otp', { usernameOrEmail: 'alice', otp: '123456' }); ok(r.status === 200 && jwt.verify(r.token, 'test-secret').channel === 'DESKTOP', 'verify-otp on the desktop channel unaffected');
  r = await plain.post('/auth/login', { usernameOrEmail: 'superadmin', password: 'admin123', channel: 'mobile' }); ok(r.status === 200 && jwt.verify(r.token, 'test-secret').channel === 'MOBILE', 'SuperAdmin mobile login is never refused');
  r = await withOtp.post('/auth/verify-otp', { usernameOrEmail: 'superadmin', otp: '123456', channel: 'mobile' }); ok(r.status === 200, 'SuperAdmin verify-otp (mobile) never refused');
  perms = ['*']; r = await plain.post('/auth/login', MOBILE); ok(r.status === 200, 'a wildcard-permission account (platform admin) is exempt like the existing guards'); perms = ['USER_VIEW'];
  owner = B.company_id; r = await plain.post('/auth/login', MOBILE); ok(r.status === 200, 'a user of ANOTHER customer (Mobile App enabled) is unaffected'); owner = A.company_id;
  await setFlag(A.company_id, 'MOBILE_APP', true);
  r = await plain.post('/auth/login', MOBILE); ok(r.status === 200 && jwt.verify(r.token, 'test-secret').channel === 'MOBILE', 'Mobile App re-enabled: the mobile login works again');

  console.log('\n[2] HCF Portal disabled (login endpoints stay public)');
  await setFlag(A.company_id, 'HCF_PORTAL', false); knownUser.v = false;
  r = await plain.post('/auth/login', HCF); ok(r.status === 403 && /HCF Portal is not enabled/.test(r.body.message) && !r.token, 'POST /auth/login with HCF credentials -> 403, clear message, no token', JSON.stringify(r.body).slice(0, 150));
  r = await plain.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'pw' }); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED' && !r.token, 'POST /hcf-auth/login -> 403, clear message, no token (no Authorization header was needed: still public)', JSON.stringify(r.body).slice(0, 150));
  r = await plain.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'wrong' }); ok(r.status === 401, 'wrong HCF password -> 401 as before (licence state not revealed)');
  owner = B.company_id; r = await plain.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'pw' }); ok(r.status === 200 && jwt.verify(r.body.data.token, 'test-secret').channel === 'HCF_PORTAL', 'an HCF of another customer (portal enabled) logs in normally'); owner = A.company_id;
  await setFlag(A.company_id, 'HCF_PORTAL', true);
  r = await plain.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'pw' }); ok(r.status === 200, 'HCF Portal re-enabled: HCF login works');
  r = await plain.post('/auth/login', HCF); ok(r.status === 200, 'and via /auth/login too'); knownUser.v = true;

  console.log('\n[3] rollout modes');
  await setFlag(A.company_id, 'MOBILE_APP', false); await setFlag(A.company_id, 'HCF_PORTAL', false);
  await setModes('SHADOW');
  r = await plain.post('/auth/login', MOBILE); ok(r.status === 200, 'SHADOW: the mobile login is allowed ...');
  knownUser.v = false; r = await plain.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'pw' }); ok(r.status === 200, '... and so is the HCF login'); knownUser.v = true;
  await ent.flushNow();
  const sh = (await db.query(`SELECT detail, route_pattern FROM entitlement_shadow_log WHERE reason='DISABLED' AND detail LIKE 'login channel%'`)).rows;
  ok(sh.some((x) => /MOBILE_APP/.test(x.detail)) && sh.some((x) => /HCF_PORTAL/.test(x.detail)), 'SHADOW: both would-be refusals are recorded', JSON.stringify(sh));
  await setModes('OFF');
  r = await plain.post('/auth/login', MOBILE); ok(r.status === 200, 'OFF: behaviour exactly as before');
  await setModes('ENFORCE'); await setFlag(A.company_id, 'MOBILE_APP', true); await setFlag(A.company_id, 'HCF_PORTAL', true); await setModes('OFF');

  console.log('\n[4] validation unchanged');
  r = await plain.post('/auth/login', { ...MOBILE, channel: 'tablet' }); ok(r.status === 400, 'invalid channel still 400');
  for (const x of [plain, withOtp]) await x.app.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
