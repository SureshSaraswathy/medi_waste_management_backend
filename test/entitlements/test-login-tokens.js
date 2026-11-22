// All six token-issuing paths: REAL AuthController, LoginUseCase, HCFLoginUseCase and AuthJwtService (real signing),
// with fake repositories / data source / OTP / permissions. The issued JWT is decoded and its claims are checked.
// Env: DIST = compiled backend (tsc --outDir). Run: DIST=<dist> NODE_PATH=<backend>/node_modules node test/entitlements/test-login-tokens.js
require('reflect-metadata');
const jwt = require('jsonwebtoken');
const { JwtService } = require('@nestjs/jwt');
const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const D = process.env.DIST;
const REQ = (p) => require(D + p);
const { AuthController } = REQ('/modules/auth/presentation/auth.controller');
const { LoginUseCase } = REQ('/modules/auth/application/use-cases/login.use-case');
const { HCFLoginUseCase } = REQ('/modules/hcf-auth/application/use-cases/hcf-login.use-case');
const { AuthJwtService } = REQ('/modules/auth/services/jwt.service');
const { LoginDto } = REQ('/modules/auth/application/dto/login.dto');
const { VerifyOtpDto } = REQ('/modules/auth/application/dto/verify-otp.dto');
const { UserEntity } = REQ('/modules/user/infrastructure/persistence/user.entity');

let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

const SA_ID = '00000000-0000-0000-0000-000000000001';
const appCfg = { superAdmin: { username: 'superadmin', password: 'admin123', staticOtp: '123456', userId: SA_ID, email: 'superadmin@medi-waste.io' }, otp: { enabled: false }, jwt: { secret: 'test-secret', expiresIn: '1h' } };
const config = { get: (k) => (k === 'app' ? appCfg : k === 'app.jwt' ? appCfg.jwt : undefined) };
const jwtService = new AuthJwtService(new JwtService({}), config);
const decode = (t) => jwt.verify(t, 'test-secret');

const COMPANY = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const userEntity = { userId: 'u0000000-0000-4000-8000-000000000001'.replace('u', 'a'), userName: 'alice', companyId: COMPANY, userRoleId: 'r1', status: 'Active' };
const userDomain = { ...userEntity, passwordEnabled: true, passwordHash: 'h', otpEnabled: false, forceOtpOnNextLogin: false, temporaryPassword: null, temporaryPasswordExpiry: null };
const hcf = { hcfId: 'h0000000-0000-4000-8000-000000000001'.replace('h', 'b'), hcfCode: 'HCF001', companyId: COMPANY, loginEnabled: true, status: 'Active', isDeleted: false, passwordHash: 'h', temporaryPassword: null, forcePasswordChange: false, contactEmail: 'h@x.com', lastLogin: null,
  isPasswordExpired: () => false, isTemporaryPasswordExpired: () => false };

// fake data source: users known by name, profiles by user, nothing for HCF codes
const ds = (knownUser) => ({
  getRepository: (Entity) => {
    const isUser = Entity === UserEntity;
    const qb = { where() { return qb; }, andWhere() { return qb; }, innerJoin() { return qb; }, select() { return qb; }, getOne: async () => (isUser && knownUser ? userEntity : null) };
    return { createQueryBuilder: () => qb, findOne: async () => (isUser ? (knownUser ? userEntity : null) : { emailAddress: 'alice@x.com' }) };
  },
});
const passwordService = { comparePassword: async () => true, isTemporaryPasswordExpired: () => false };
const permissionService = { loadUserPermissions: async () => ['USER_VIEW'] };
const userRepository = { findByUserName: async () => userDomain, findById: async () => userDomain };
const hcfRepository = { findByCode: async () => hcf, findByCodeOrEmail: async () => hcf, findById: async () => hcf, update: async () => hcf };
const cfgWith = (otp) => ({ get: (k) => (k === 'app' ? { ...appCfg, otp: { enabled: otp } } : k === 'app.jwt' ? appCfg.jwt : undefined) });
const mkLogin = (knownUser, otp) => new LoginUseCase(userRepository, hcfRepository, passwordService, jwtService, permissionService, ds(knownUser), cfgWith(otp));
const mkController = (knownUser, otp = false) => new AuthController(mkLogin(knownUser, otp), cfgWith(otp), {}, { verifyOTP: () => ({ valid: true }) }, jwtService, permissionService, ds(knownUser));

(async () => {
  for (const ch of [undefined, 'desktop', 'mobile']) {
    const expectClaim = ch === 'mobile' ? 'MOBILE' : 'DESKTOP';
    console.log(`\n[channel sent: ${ch === undefined ? '(none)' : ch}]`);
    let r = await mkController(false).login({ usernameOrEmail: 'superadmin', password: 'admin123', channel: ch });
    let t = decode(r.data.token);
    ok(t.channel === expectClaim && t.userId === SA_ID, `path 1 /auth/login SuperAdmin -> channel ${expectClaim}`, JSON.stringify(t));
    r = await mkController(true).login({ usernameOrEmail: 'alice', password: 'pw', channel: ch });
    t = decode(r.data.token);
    ok(t.channel === expectClaim && t.companyId === COMPANY && t.userType === undefined, `path 2 /auth/login user -> channel ${expectClaim}`, JSON.stringify(t));
    r = await mkController(true, true).verifyOtp({ usernameOrEmail: 'superadmin', otp: '123456', channel: ch });
    t = decode(r.data.token);
    ok(t.channel === expectClaim && t.userId === SA_ID, `path 4 /auth/verify-otp SuperAdmin -> channel ${expectClaim}`, JSON.stringify(t));
    r = await mkController(true, true).verifyOtp({ usernameOrEmail: 'alice', otp: '123456', channel: ch });
    t = decode(r.data.token);
    ok(t.channel === expectClaim && t.companyId === COMPANY, `path 5 /auth/verify-otp user -> channel ${expectClaim}`, JSON.stringify(t));
  }
  console.log('\n[HCF paths: the channel is fixed, a client cannot change it]');
  let r = await mkController(false).login({ usernameOrEmail: 'HCF001', password: 'pw', channel: 'mobile' });
  let t = decode(r.data.token);
  ok(t.channel === 'HCF_PORTAL' && t.userType === 'HCF' && t.userId === hcf.hcfId && t.companyId === COMPANY, 'path 3 /auth/login (HCF branch) -> HCF_PORTAL + userType HCF, even if the client sends mobile', JSON.stringify(t));
  r = await mkController(false).login({ usernameOrEmail: 'HCF001', password: 'pw' });
  t = decode(r.data.token); ok(t.channel === 'HCF_PORTAL' && t.userType === 'HCF', 'path 3 without channel -> HCF_PORTAL + userType HCF');
  const hcfLogin = new HCFLoginUseCase(hcfRepository, passwordService, jwtService, { loadUserPermissions: async () => [] });
  const hr = await hcfLogin.execute('HCF001', 'pw');
  t = decode(hr.token); ok(t.channel === 'HCF_PORTAL' && t.userType === 'HCF' && t.userId === hcf.hcfId, 'path 6 /hcf-auth/login -> HCF_PORTAL + userType HCF', JSON.stringify(t));

  console.log('\n[validation: invalid channel values are rejected]');
  const bad = async (Cls, body) => (await validate(plainToInstance(Cls, body), { whitelist: true, forbidNonWhitelisted: true })).length;
  ok(await bad(LoginDto, { usernameOrEmail: 'a', password: 'b', channel: 'tablet' }) > 0, 'LoginDto rejects channel "tablet"');
  ok(await bad(LoginDto, { usernameOrEmail: 'a', password: 'b', channel: 'HCF_PORTAL' }) > 0, 'LoginDto rejects channel "HCF_PORTAL" (a client can never ask for the HCF claim)');
  ok(await bad(LoginDto, { usernameOrEmail: 'a', password: 'b', channel: 'MOBILE' }) > 0, 'LoginDto rejects upper-case "MOBILE"');
  ok(await bad(VerifyOtpDto, { usernameOrEmail: 'a', otp: '123456', channel: 'tablet' }) > 0, 'VerifyOtpDto rejects channel "tablet"');
  ok(await bad(LoginDto, { usernameOrEmail: 'a', password: 'b', channel: 'mobile' }) === 0 && await bad(LoginDto, { usernameOrEmail: 'a', password: 'b' }) === 0, 'LoginDto accepts "mobile" and no channel at all (existing clients are unaffected)');
  ok(await bad(VerifyOtpDto, { usernameOrEmail: 'a', otp: '123456', channel: 'mobile' }) === 0, 'VerifyOtpDto accepts "mobile"');

  console.log('\n[HTTP level: real Nest app, global ValidationPipe exactly as in main.ts, real controllers, tokens decoded from the HTTP responses]');
  const { Test } = require('@nestjs/testing');
  const { ValidationPipe } = require('@nestjs/common');
  const { ConfigService } = require('@nestjs/config');
  const { getDataSourceToken } = require('@nestjs/typeorm');
  const { HCFAuthController: HcfAuthController } = REQ('/modules/hcf-auth/presentation/hcf-auth.controller');
  const { EmailService } = REQ('/modules/auth/services/email.service');
  const { OtpService } = REQ('/modules/auth/services/otp.service');
  const { PermissionService } = REQ('/modules/auth/services/permission.service');
  const { JwtAuthGuard } = REQ('/modules/auth/guards/jwt-auth.guard');
  const { PermissionsGuard } = REQ('/modules/auth/guards/permissions.guard');
  const UC = '/modules/hcf-auth/application/use-cases/';
  const otherHcfUseCases = [
    [UC + 'admin-reset-hcf-password.use-case', 'AdminResetHCFPasswordUseCase'], [UC + 'request-hcf-password-reset.use-case', 'RequestHCFPasswordResetUseCase'],
    [UC + 'reset-hcf-password-with-token.use-case', 'ResetHCFPasswordWithTokenUseCase'], [UC + 'change-hcf-password.use-case', 'ChangeHCFPasswordUseCase'],
  ].map(([p, n]) => ({ provide: REQ(p)[n], useValue: {} }));
  const hcfUseCase = new HCFLoginUseCase(hcfRepository, passwordService, jwtService, { loadUserPermissions: async () => [] });
  const httpFor = async (knownUser, otp) => {
    const modRef = await Test.createTestingModule({
      controllers: [AuthController, HcfAuthController],
      providers: [
        { provide: LoginUseCase, useValue: mkLogin(knownUser, otp) }, { provide: ConfigService, useValue: cfgWith(otp) }, { provide: EmailService, useValue: {} },
        { provide: OtpService, useValue: { verifyOTP: () => ({ valid: true }) } }, { provide: AuthJwtService, useValue: jwtService },
        { provide: PermissionService, useValue: permissionService }, { provide: getDataSourceToken('master'), useValue: ds(knownUser) },
        { provide: HCFLoginUseCase, useValue: hcfUseCase }, JwtAuthGuard, PermissionsGuard, ...otherHcfUseCases,
      ],
    }).compile();
    const app = modRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    await app.listen(0);
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;
    const post = async (p, body) => { const r = await fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); let j = null; try { j = await r.json(); } catch { /* none */ } return { status: r.status, body: j, token: j && j.data && j.data.token }; };
    return { app, post };
  };
  const hNoOtp = await httpFor(true, false), hOtp = await httpFor(true, true), hHcf = await httpFor(false, false);
  let h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'alice', password: 'pw', channel: 'mobile' });
  ok(h.status === 200 && decode(h.token).channel === 'MOBILE', 'HTTP POST /auth/login {channel:"mobile"} -> 200, token channel MOBILE', JSON.stringify(h.body).slice(0, 120));
  h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'alice', password: 'pw' });
  ok(h.status === 200 && decode(h.token).channel === 'DESKTOP', 'HTTP POST /auth/login without channel -> 200, token channel DESKTOP (existing clients unchanged)');
  h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'superadmin', password: 'admin123', channel: 'mobile' });
  ok(h.status === 200 && decode(h.token).channel === 'MOBILE', 'HTTP SuperAdmin login with channel -> MOBILE');
  h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'alice', password: 'pw', channel: 'tablet' });
  ok(h.status === 400, 'HTTP invalid channel "tablet" -> 400 from the real ValidationPipe', String(h.status));
  h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'alice', password: 'pw', channel: 'HCF_PORTAL' });
  ok(h.status === 400, 'HTTP channel "HCF_PORTAL" requested by a client -> 400');
  h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'alice', password: 'pw', userType: 'HCF' });
  ok(h.status === 400, 'HTTP body field "userType" (claim injection) -> 400 (forbidNonWhitelisted)');
  h = await hNoOtp.post('/auth/login', { usernameOrEmail: 'alice', password: 'pw', channel: 'mobile', permissions: ['*'] });
  ok(h.status === 400, 'HTTP body field "permissions" -> 400');
  h = await hHcf.post('/auth/login', { usernameOrEmail: 'HCF001', password: 'pw', channel: 'mobile' });
  let ht = h.token ? decode(h.token) : {};
  ok(h.status === 200 && ht.channel === 'HCF_PORTAL' && ht.userType === 'HCF', 'HTTP HCF credentials on /auth/login (path 3), even with channel:"mobile" -> HCF_PORTAL + userType HCF', JSON.stringify(h.body).slice(0, 120));
  h = await hOtp.post('/auth/verify-otp', { usernameOrEmail: 'alice', otp: '123456', channel: 'mobile' });
  ok(h.status === 200 && decode(h.token).channel === 'MOBILE' && decode(h.token).companyId === COMPANY, 'HTTP POST /auth/verify-otp {channel:"mobile"} (user) -> MOBILE', JSON.stringify(h.body).slice(0, 120));
  h = await hOtp.post('/auth/verify-otp', { usernameOrEmail: 'superadmin', otp: '123456', channel: 'mobile' });
  ok(h.status === 200 && decode(h.token).channel === 'MOBILE', 'HTTP /auth/verify-otp SuperAdmin -> MOBILE');
  h = await hOtp.post('/auth/verify-otp', { usernameOrEmail: 'alice', otp: '123456' });
  ok(h.status === 200 && decode(h.token).channel === 'DESKTOP', 'HTTP /auth/verify-otp without channel -> DESKTOP');
  h = await hOtp.post('/auth/verify-otp', { usernameOrEmail: 'alice', otp: '123456', channel: 'tablet' });
  ok(h.status === 400, 'HTTP /auth/verify-otp invalid channel -> 400');
  h = await hHcf.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'pw' });
  ht = h.token ? decode(h.token) : {};
  ok(h.status === 200 && ht.channel === 'HCF_PORTAL' && ht.userType === 'HCF', 'HTTP POST /hcf-auth/login (path 6) -> HCF_PORTAL + userType HCF', JSON.stringify(h.body).slice(0, 160));
  h = await hHcf.post('/hcf-auth/login', { hcfCode: 'HCF001', password: 'pw', channel: 'mobile' });
  ok(h.status === 400, 'HTTP /hcf-auth/login rejects a client-supplied channel');
  for (const x of [hNoOtp, hOtp, hHcf]) await x.app.close();

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
