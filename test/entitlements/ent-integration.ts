/* Integration test: REAL entitlement controllers, service, repository, interceptor and PermissionsGuard, running
 * over an in-memory PostgreSQL replica of the dev master DB with the entitlement migrations applied.
 * Only the authentication guard is replaced (it just sets req.user from a header). Nothing real is written. */
import 'reflect-metadata';
import { Controller, Get, Post, Body, Query, Param, UseGuards, Module, CanActivate, ExecutionContext, Injectable, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { IsUUID, IsString } from 'class-validator';
import { ForbiddenException, Put, Delete, Patch } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

const D = process.env.DIST as string;
const REQ = (p: string) => require(D + p);
const { EntitlementRepository } = REQ('/modules/entitlement/infrastructure/entitlement.repository');
const { EntitlementService } = REQ('/modules/entitlement/application/entitlement.service');
const { TenantOwnershipService } = REQ('/modules/entitlement/application/tenant-ownership.service');
const { EntitlementInterceptor } = REQ('/modules/entitlement/presentation/entitlement.interceptor');
const { EntitlementAdminController } = REQ('/modules/entitlement/presentation/entitlement-admin.controller');
const { EntitlementMeController } = REQ('/modules/entitlement/presentation/entitlement-me.controller');
const { EntitlementAdminGuard } = REQ('/modules/entitlement/presentation/entitlement-admin.guard');
const { JwtAuthGuard } = REQ('/modules/auth/guards/jwt-auth.guard');
const { PermissionsGuard } = REQ('/modules/auth/guards/permissions.guard');
const { RequirePermissions } = REQ('/modules/auth/decorators/require-permissions.decorator');
const { UserController } = REQ('/modules/user/presentation/user.controller');
const { GetUserByUsernameUseCase } = REQ('/modules/user/application/use-cases/get-user-by-username.use-case');
const { loadReal, build } = require(process.env.PGT + '/replica');
const { runAll, FILES } = require(process.env.BE + '/scripts/entitlements/run-migrations.js');
const fs = require('fs');

@Injectable()
class FakeJwt implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const r = ctx.switchToHttp().getRequest();
    const h = r.headers['x-test-user'];
    if (!h) throw new UnauthorizedException();
    r.user = JSON.parse(h as string);
    return true;
  }
}

class RegDto { @IsUUID() companyId!: string; @IsString() name!: string; }

// stand-ins that use the REAL route patterns found in endpoint_feature_map
@Controller('invoices') @UseGuards(FakeJwt, PermissionsGuard)
class InvoiceCtl {
  @Get() @RequirePermissions('INVOICE_VIEW') list(@Query('companyId') c?: string) { return { success: true, data: [{ id: 'i1' }], listedFor: c ?? null }; }
  @Get(':id') @RequirePermissions('INVOICE_VIEW') one(@Param('id') id: string) { return { success: true, id }; }
  @Post() @RequirePermissions('INVOICE_CREATE') create(@Body() b: any) { return { success: true }; }
}
@Controller('incident-registers') @UseGuards(FakeJwt)
class RegisterCtl {
  @Get() list(@Query('companyId') c?: string) { return { listedFor: c ?? null }; }
  @Post() create(@Body() b: RegDto) { return { created: b }; }
}
let ALL_COMPANIES: any[] = [];
@Controller('companies') @UseGuards(FakeJwt, PermissionsGuard)
class CompaniesCtl {
  @Get() @RequirePermissions('COMPANY_VIEW') list() { return { success: true, data: ALL_COMPANIES.map((c) => ({ id: c.company_id, companyCode: c.company_code })) }; }
  @Post() @RequirePermissions('COMPANY_CREATE') create() { return { success: true }; }
  @Get(':id') @RequirePermissions('COMPANY_VIEW') one(@Param('id') id: string) { return { success: true, id }; }
}
@Controller('reports') @UseGuards(FakeJwt, PermissionsGuard)
class ReportsCtl {
  @Post('invoices') @RequirePermissions('INVOICE_VIEW') inv() { return { ok: 'invoice-report' }; }
  @Post('route-trip') @RequirePermissions('WASTE_COLLECTION_VIEW') trip() { return { ok: 'route-trip' }; }
}
@Controller('dashboard') @UseGuards(FakeJwt, PermissionsGuard)
class DashCtl { @Get('kpi/total-invoices') @RequirePermissions('DASHBOARD_VIEW') kpi() { return { ok: 'kpi' }; } }
@Controller('brandnew') @UseGuards(FakeJwt)
class NewCtl { @Get() x() { return { ok: 'new route not in the mapping table' }; } }
@Controller('payments') @UseGuards(FakeJwt, PermissionsGuard)
class PayCtl { @Post('record') @RequirePermissions('INVOICE_CREATE') rec() { return { ok: 'record' }; } @Get() @RequirePermissions('INVOICE_VIEW') list() { return { ok: 'payments' }; } }

let DB: any;
@Controller('vehicle-waste-collections') @UseGuards(FakeJwt)
class VehicleCtl {
  @Get() async list() { return { success: true, data: (await DB.query('SELECT vehicle_waste_collection_id AS id, vehicle_id AS "vehicleId" FROM vehicle_waste_collections')).rows }; }
  @Get(':id') one(@Param('id') id: string) { return { id }; }
  @Post() create(@Body() b: any) { return { created: b }; }
  @Put(':id') upd(@Param('id') id: string) { return { id }; }
  @Put(':id/submit') sub(@Param('id') id: string) { return { id }; }
  @Put(':id/verify') ver(@Param('id') id: string) { return { id }; }
  @Delete(':id') del(@Param('id') id: string) { return { id }; }
}
@Controller('compliance') @UseGuards(FakeJwt)
class ComplianceCtl {
  @Get() async list() { return (await DB.query('SELECT id, company_id AS "companyId" FROM compliance_register')).rows; }
  @Get(':id') one(@Param('id') id: string) { return { id }; }
  @Patch(':id') upd(@Param('id') id: string) { return { id }; }
  @Delete(':id') del(@Param('id') id: string) { return { id }; }
}
@Controller('notifications') @UseGuards(FakeJwt)
class NotifCtl { @Get('my') my() { return []; } }

let pass = 0, fail = 0;
const ok = (c: boolean, n: string, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const runner = (db: any): any => ({
  async query(sql: string, params?: any[]) { const r = await db.query(sql, params || []); return r.rows; },
  async transaction(work: any) { return db.transaction(async (tx: any) => work(runner(tx))); },
});

(async () => {
  const real = await loadReal();
  const db = await build(real);
  DB = db;
  const migr = await runAll({ client: { query: async (s: string, p?: any[]) => (p ? db.query(s, p) : (await db.exec(s)).slice(-1)[0] || { rows: [] }) }, files: FILES.map(([id, f]: any) => [id, fs.readFileSync(`${process.env.BE}/migrations/${f}`, 'utf8')]), log: () => {} });
  if (!migr.ok) throw new Error('migration failed: ' + migr.reason);
  await db.exec(`CREATE TABLE invoices (invoice_id uuid PRIMARY KEY, company_id uuid)`);
  const [A, B] = real.companies.rows.filter((c: any) => !c.is_deleted);
  ALL_COMPANIES = real.companies.rows;
  await db.query(`INSERT INTO invoices VALUES (gen_random_uuid(), $1)`, [A.company_id]);
  const invA = (await db.query(`SELECT invoice_id FROM invoices WHERE company_id=$1`, [A.company_id])).rows[0].invoice_id;
  const SQLR = runner(db);
  const repo = EntitlementRepository.over(SQLR);
  const cfg = { get: (k: string) => (k === 'app' ? { superAdmin: { userId: '00000000-0000-0000-0000-000000000001', email: 'superadmin@medi-waste.io', username: 'superadmin' } } : undefined) };
  const service = new EntitlementService(repo, cfg as any, { flagsTtlMs: 30000, modesTtlMs: 15000, flushIntervalMs: 3600000 });
  const dsFake = { query: (s: string, p?: any[]) => SQLR.query(s, p) };

  @Module({
    controllers: [VehicleCtl, ComplianceCtl, NotifCtl, EntitlementAdminController, EntitlementMeController, InvoiceCtl, RegisterCtl, CompaniesCtl, ReportsCtl, DashCtl, NewCtl, PayCtl],
    providers: [
      FakeJwt, PermissionsGuard, EntitlementAdminGuard, TenantOwnershipService,
      { provide: ConfigService, useValue: cfg }, { provide: EntitlementService, useValue: service },
      { provide: getDataSourceToken('master'), useValue: dsFake }, { provide: getDataSourceToken('transaction'), useValue: dsFake },
      { provide: APP_INTERCEPTOR, useClass: EntitlementInterceptor },
    ],
  })
  class TestModule {}

  const mod = await Test.createTestingModule({ imports: [TestModule] }).overrideGuard(JwtAuthGuard).useValue(new FakeJwt()).compile();
  const app = mod.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  await app.listen(0);
  const base = (await app.getUrl()).replace('[::1]', 'localhost') + '/api/v1';

  const SUPER = JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001', userName: 'superadmin', email: 'superadmin@medi-waste.io', companyId: '00000000-0000-0000-0000-000000000000', permissions: ['*'] });
  const PERMS = ['INVOICE_VIEW', 'INVOICE_CREATE', 'COMPANY_VIEW', 'COMPANY_CREATE', 'DASHBOARD_VIEW', 'WASTE_COLLECTION_VIEW'];
  const adminA = JSON.stringify({ userId: 'a0000000-0000-4000-8000-000000000001', userName: 'adminA', email: 'a@a.com', companyId: A.company_id, permissions: PERMS });
  const nopermA = JSON.stringify({ userId: 'a0000000-0000-4000-8000-000000000002', userName: 'nopermA', companyId: A.company_id, permissions: [] });
  const adminB = JSON.stringify({ userId: 'b0000000-0000-4000-8000-000000000001', userName: 'adminB', companyId: B.company_id, permissions: PERMS });
  const call = async (method: string, path: string, user?: string, body?: any, extra: Record<string, string> = {}) => {
    const r = await fetch(base + path, { method, headers: { ...extra, ...(user ? { 'x-test-user': user } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let b: any; try { b = await r.json(); } catch { b = null; } return { status: r.status, body: b };
  };
  const setMode = (mode: string, tenantMode = 'OFF') => call('PUT', '/admin/entitlements/mode', SUPER, { mode, tenantMode });
  const save = (companyId: string, changes: any[], extra: any = {}) => call('PUT', `/admin/entitlements/companies/${companyId}`, SUPER, { changes, ...extra });
  const tree = async (id: string) => (await call('GET', `/admin/entitlements/companies/${id}`, SUPER)).body.data;
  const find = (t: any, code: string): any => { for (const m of t.modules) { if (m.code === code) return m; for (const s of m.submodules) { if (s.code === code) return s; for (const f of s.features) if (f.code === code) return f; } } return null; };
  const rows = async () => (await db.query(`SELECT count(*)::int n FROM company_entitlements`)).rows[0].n;
  const flush = () => service.flushNow();

  console.log(`Replica: ${real.companies.rows.length} companies, migrations applied (${FILES.length} files)\n`);

  console.log('[1] Admin API is SuperAdmin-only');
  for (const [m, p] of [['GET', '/admin/entitlements/catalogue'], ['GET', '/admin/entitlements/companies'], ['GET', `/admin/entitlements/companies/${A.company_id}`], ['GET', `/admin/entitlements/companies/${A.company_id}/audit`], ['GET', '/admin/entitlements/mode'], ['GET', '/admin/entitlements/shadow-report']]) {
    const anon = await call(m, p); const cust = await call(m, p, adminA); const sup = await call(m, p, SUPER);
    ok(anon.status === 401 && cust.status === 403 && sup.status === 200, `${m} ${p.replace(A.company_id, ':id')}: no login 401, Customer Admin 403, SuperAdmin 200`, `${anon.status}/${cust.status}/${sup.status}`);
  }
  let r = await call('PUT', `/admin/entitlements/companies/${A.company_id}`, adminA, { changes: [{ code: 'FINANCE', enabled: false }] });
  ok(r.status === 403, 'Customer Admin cannot change entitlements (PUT) even with every RBAC permission');
  r = await call('PUT', '/admin/entitlements/mode', adminA, { mode: 'ENFORCE' });
  ok(r.status === 403, 'Customer Admin cannot change the rollout mode');
  ok((await tree(A.company_id)).modules.find((m: any) => m.code === 'FINANCE').stored === true, 'nothing changed by the refused calls');

  console.log('\n[2] Existing customers were backfilled with everything enabled');
  r = await call('GET', '/entitlements/me', adminA);
  ok(r.status === 200 && r.body.data.modules.length === 11 && r.body.data.features.length === 267, `existing customer sees all 11 modules and 267 features (${r.body.data.modules.length}/${r.body.data.features.length})`);
  ok(r.body.data.modules.includes('MOBILE_APP') && r.body.data.modules.includes('HCF_PORTAL'), 'Mobile App and HCF Portal are enabled for existing customers');
  ok(r.body.data.mode === 'OFF' && r.body.data.tenantMode === 'OFF', 'rollout starts OFF');
  const t0 = await tree(A.company_id);
  ok(t0.totals.newItems === 0 && !find(t0, 'FINANCE').isNew, 'no NEW markers for a backfilled customer');
  r = await call('GET', `/entitlements/me?companyId=${B.company_id}`, adminA);
  ok(r.body.data.modules.length === 11, '/entitlements/me ignores any company parameter (always the caller\'s own, from the JWT)');
  r = await call('GET', '/entitlements/me', SUPER);
  ok(r.body.data.isSuperAdmin === true && r.body.data.modules.length === 11, 'SuperAdmin sees everything');

  console.log('\n[3] Parent / child enable and disable, nothing is deleted');
  const rowsBefore = await rows();
  const childSnap = JSON.stringify((await db.query(`SELECT entity_code, is_enabled, updated_on FROM company_entitlements WHERE company_id=$1 AND entity_code LIKE 'FINANCE.%' ORDER BY entity_code`, [A.company_id])).rows);
  // make a submodule and a feature individually disabled first, so we can prove they are remembered
  r = await save(A.company_id, [{ code: 'FINANCE.INVOICE_MGMT.DOWNLOAD_PDF', enabled: false }, { code: 'FINANCE.RECEIPT_MGMT', enabled: false }]);
  ok(r.status === 200 && r.body.data.changed === 2, 'disable one feature and one submodule');
  const afterChild = JSON.stringify((await db.query(`SELECT entity_code, is_enabled FROM company_entitlements WHERE company_id=$1 AND entity_code LIKE 'FINANCE.%' ORDER BY entity_code`, [A.company_id])).rows);
  let tr = await tree(A.company_id);
  ok(find(tr, 'FINANCE.INVOICE_MGMT.VIEW').effective === true && find(tr, 'FINANCE.INVOICE_MGMT.DOWNLOAD_PDF').effective === false, 'features are independent while the parent is on');
  ok(find(tr, 'FINANCE.RECEIPT_MGMT.VIEW').effective === false && find(tr, 'FINANCE.PAYMENT.VIEW').effective === true, 'a disabled submodule disables only its own features');
  const stateBeforeModuleOff = JSON.stringify((await db.query(`SELECT entity_code, is_enabled, updated_on FROM company_entitlements WHERE company_id=$1 AND entity_code LIKE 'FINANCE.%' ORDER BY entity_code`, [A.company_id])).rows);
  r = await save(A.company_id, [{ code: 'FINANCE', enabled: false }], { reason: 'plan downgrade' });
  ok(r.status === 200 && r.body.data.changed === 1, 'disable the whole Finance module (one change)');
  tr = await tree(A.company_id);
  ok(find(tr, 'FINANCE').stored === false && find(tr, 'FINANCE').effective === false, 'module is stored false and not effective');
  ok(find(tr, 'FINANCE.INVOICE_MGMT.VIEW').stored === true && find(tr, 'FINANCE.INVOICE_MGMT.VIEW').effective === false, 'children keep their stored value (true) but are not effective: shown as "inactive, parent off"');
  ok(JSON.stringify((await db.query(`SELECT entity_code, is_enabled, updated_on FROM company_entitlements WHERE company_id=$1 AND entity_code LIKE 'FINANCE.%' ORDER BY entity_code`, [A.company_id])).rows) === stateBeforeModuleOff, 'no child row was touched at all (same values, same updated_on)');
  ok((await rows()) === rowsBefore, 'row count unchanged: disabling never deletes data');
  const effOff = (await call('GET', '/entitlements/me', adminA)).body.data;
  ok(!effOff.modules.includes('FINANCE') && !effOff.submodules.some((s: string) => s.startsWith('FINANCE.')) && !effOff.features.some((s: string) => s.startsWith('FINANCE.')), 'the customer list drops the module and all its submodules and features');
  r = await save(A.company_id, [{ code: 'FINANCE', enabled: true }]);
  tr = await tree(A.company_id);
  ok(find(tr, 'FINANCE.INVOICE_MGMT.VIEW').effective === true && find(tr, 'FINANCE.PAYMENT.VIEW').effective === true, 'enabling the module again restores the children that were on');
  ok(find(tr, 'FINANCE.INVOICE_MGMT.DOWNLOAD_PDF').effective === false && find(tr, 'FINANCE.RECEIPT_MGMT.VIEW').effective === false, 'the earlier individual "off" choices (feature, submodule) were remembered');
  ok((await rows()) === rowsBefore, 'row count still unchanged after the full cycle');
  r = await save(A.company_id, [{ code: 'FINANCE.INVOICE_MGMT.DOWNLOAD_PDF', enabled: true }, { code: 'FINANCE.RECEIPT_MGMT', enabled: true }]);
  ok(find(await tree(A.company_id), 'FINANCE.RECEIPT_MGMT.VIEW').effective === true, 'everything can be switched back on');

  console.log('\n[4] Core items and validation');
  r = await save(A.company_id, [{ code: 'DASHBOARD', enabled: false }]);
  ok(r.status === 422 && r.body.code === 'CORE_LOCKED', 'disabling a core module is refused (422 CORE_LOCKED)');
  r = await save(A.company_id, [{ code: 'ADMINISTRATION.USER_MGMT.CREATE', enabled: false }]);
  ok(r.status === 422 && r.body.code === 'CORE_LOCKED', 'disabling a feature under a core module is refused');
  r = await save(A.company_id, [{ code: 'NOT.A.CODE', enabled: true }]);
  ok(r.status === 422 && r.body.code === 'VALIDATION_FAILED', 'unknown code is refused');
  r = await save(A.company_id, [{ code: 'FINANCE', enabled: true }, { code: 'FINANCE', enabled: false }]);
  ok(r.status === 422, 'duplicate code in one save is refused');
  const staleV = (await tree(A.company_id)).version;
  r = await save(A.company_id, [{ code: 'REPORTS', enabled: false }]);
  r = await save(A.company_id, [{ code: 'REPORTS', enabled: true }], { expectedVersion: staleV });
  ok(r.status === 409 && r.body.code === 'VERSION_CONFLICT', 'saving with a stale version is refused (409), nothing overwritten');
  r = await save(A.company_id, [{ code: 'REPORTS', enabled: true }], { expectedVersion: (await tree(A.company_id)).version });
  ok(r.status === 200, 'saving with the current version succeeds');
  r = await save(A.company_id, [{ code: 'REPORTS', enabled: true }]);
  ok(r.status === 200 && r.body.data.changed === 0, 'saving an unchanged value is a no-op');
  ok((await call('GET', `/admin/entitlements/companies/not-a-uuid`, SUPER)).status === 400, 'malformed customer id is a 400');

  console.log('\n[5] Audit history');
  r = await call('GET', `/admin/entitlements/companies/${A.company_id}/audit?pageSize=5&code=FINANCE`, SUPER);
  const a = r.body.data.rows.find((x: any) => x.entityCode === 'FINANCE' && x.newValue === false);
  ok(!!a && a.oldValue === true && a.newValue === false, 'FINANCE disable recorded with old value true and new value false');
  ok(a && a.changedByName === 'superadmin' && a.action === 'SET' && a.reason === 'plan downgrade', 'records who (user name), the reason and the action');
  ok(a && Math.abs(Date.now() - new Date(a.changedOn).getTime()) < 120000, 'records when (date and time)');
  ok(a && a.companyId === A.company_id && !!a.batchId, 'records the customer and a batch id for the save');
  r = await call('GET', `/admin/entitlements/companies/${A.company_id}/audit?user=superadmin&from=2020-01-01`, SUPER);
  ok(r.body.data.total > 5 && r.body.data.rows.every((x: any) => (x.changedByName || '').includes('superadmin')), 'audit can be filtered by user and date');
  ok((await db.query(`SELECT count(*)::int n FROM company_entitlement_audit WHERE action='BACKFILL'`)).rows[0].n === real.companies.rows.filter((c: any) => !c.is_deleted).length * 341, 'the original backfill is in the audit trail');
  ok(!/DELETE\s+FROM/i.test(fs.readFileSync(process.env.BE + '/src/modules/entitlement/infrastructure/entitlement.repository.ts', 'utf8')), 'the repository contains no DELETE statement at all');

  console.log('\n[6] Backend enforcement (interceptor)');
  r = await setMode('OFF');
  ok(r.status === 200 && r.body.data.mode === 'OFF', 'mode OFF');
  await save(A.company_id, [{ code: 'FINANCE', enabled: false }]);
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'OFF: a disabled module is NOT blocked (inert)');
  r = await setMode('SHADOW'); ok(r.body.data.mode === 'SHADOW', 'mode SHADOW');
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'SHADOW: request still succeeds');
  await flush();
  const rep = (await call('GET', '/admin/entitlements/shadow-report?days=14', SUPER)).body.data;
  ok(rep.byReason.some((x: any) => x.reason === 'DISABLED' && x.hits >= 1), 'SHADOW: the would-be block is recorded as DISABLED', JSON.stringify(rep.byReason));
  ok(rep.top.some((x: any) => x.route_pattern === '/invoices') && rep.coverage.exercised >= 1, 'shadow report lists the endpoint and the coverage counters');
  ok(rep.modes.mode === 'SHADOW' && Array.isArray(rep.neverHit), 'report carries the mode and the never-exercised endpoint list');
  r = await setMode('ENFORCE'); ok(r.body.data.mode === 'ENFORCE', 'mode ENFORCE');
  r = await call('GET', '/invoices', adminA);
  ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED' && /FINANCE/.test(r.body.feature), 'ENFORCE: disabled module blocks the API (403 FEATURE_NOT_LICENSED)', JSON.stringify(r.body));
  r = await call('POST', '/invoices', adminA, {}); ok(r.status === 403, 'ENFORCE: create is blocked too');
  r = await call('POST', '/payments/record', adminA, {}); ok(r.status === 403, 'ENFORCE: another Finance endpoint is blocked');
  r = await call('POST', '/reports/invoices', adminA, {}); ok(r.status === 200 || r.status === 201, 'ENFORCE: a Reports endpoint on the same permission code is NOT blocked (different module)');
  r = await call('GET', '/dashboard/kpi/total-invoices', adminA); ok(r.status === 200, 'ENFORCE: the Dashboard (core) stays available');
  r = await call('GET', '/invoices', adminB); ok(r.status === 200, 'ENFORCE: another customer with Finance enabled is unaffected');
  r = await call('GET', '/invoices', SUPER); ok(r.status === 200, 'ENFORCE: SuperAdmin is never blocked');

  console.log('\n[7] Effective access needs BOTH entitlement and RBAC permission');
  r = await call('GET', '/invoices', nopermA); ok(r.status === 403 && !r.body.code && /permission/i.test(JSON.stringify(r.body)), 'no permission + module disabled: the existing RBAC answer comes first, unchanged');
  await save(A.company_id, [{ code: 'FINANCE', enabled: true }]);
  r = await call('GET', '/invoices', nopermA); ok(r.status === 403 && /permission/i.test(JSON.stringify(r.body)), 'enabling the module does NOT grant the permission (still the RBAC 403)');
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'entitled AND permitted: allowed');
  r = await call('GET', '/invoices'); ok(r.status === 401, 'no token: 401 as before');
  const rp = await db.query(`SELECT count(*)::int n FROM role_permissions`); ok(rp.rows[0].n === (real.role_permissions.rows.length || 18), 'role_permissions untouched by all of this');

  console.log('\n[8] Any-of mapping for shared endpoints');
  await save(A.company_id, [{ code: 'FINANCE.INVOICE_MGMT', enabled: false }, { code: 'FINANCE.INVOICE_GENERATION', enabled: false }, { code: 'FINANCE.RECEIPT_MGMT', enabled: false }, { code: 'FINANCE.FIN_BALANCE', enabled: false }]);
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'invoice list still allowed while Payment (one of the five viewers) is enabled');
  r = await call('POST', '/invoices', adminA, {}); ok(r.status === 403, 'but creating an invoice needs Invoice Management > Create');
  await save(A.company_id, [{ code: 'FINANCE.PAYMENT', enabled: false }]);
  r = await call('GET', '/invoices', adminA); ok(r.status === 403, 'all five viewers off: the list is blocked');
  await save(A.company_id, [{ code: 'FINANCE.INVOICE_MGMT', enabled: true }, { code: 'FINANCE.INVOICE_GENERATION', enabled: true }, { code: 'FINANCE.RECEIPT_MGMT', enabled: true }, { code: 'FINANCE.FIN_BALANCE', enabled: true }, { code: 'FINANCE.PAYMENT', enabled: true }]);
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'restored');

  console.log('\n[9] Unmapped endpoints');
  await setMode('SHADOW');
  r = await call('GET', '/brandnew', adminA); ok(r.status === 200, 'SHADOW: unmapped endpoint continues');
  await flush();
  ok((await call('GET', '/admin/entitlements/shadow-report', SUPER)).body.data.byReason.some((x: any) => x.reason === 'UNMAPPED'), 'SHADOW: recorded as UNMAPPED');
  await setMode('ENFORCE');
  r = await call('GET', '/brandnew', adminA); ok(r.status === 403 && r.body.code === 'ENDPOINT_NOT_MAPPED', 'ENFORCE: an unmapped endpoint fails closed for customers');
  r = await call('GET', '/brandnew', SUPER); ok(r.status === 200, 'ENFORCE: SuperAdmin unaffected');
  await setMode('OFF');

  console.log('\n[10] Tenant ownership (JWT based)');
  await setMode('OFF', 'SHADOW');
  r = await call('GET', `/incident-registers?companyId=${B.company_id}`, adminA); ok(r.status === 200, 'tenant SHADOW: other company in the query is only logged');
  await flush();
  ok((await call('GET', '/admin/entitlements/shadow-report', SUPER)).body.data.byReason.some((x: any) => x.reason === 'TENANT_MISMATCH'), 'tenant SHADOW: TENANT_MISMATCH recorded');
  await setMode('OFF', 'ENFORCE');
  r = await call('GET', `/incident-registers?companyId=${B.company_id}`, adminA); ok(r.status === 403 && r.body.code === 'TENANT_MISMATCH', 'ENFORCE: another company in the query is refused');
  r = await call('GET', `/incident-registers?companyId=${A.company_id}`, adminA); ok(r.status === 200 && r.body.listedFor === A.company_id, 'own company in the query still works (existing behaviour)');
  r = await call('GET', '/incident-registers', adminA); ok(r.status === 200 && r.body.listedFor === A.company_id, 'no companyId: filled from the JWT');
  r = await call('POST', '/incident-registers', adminA, { companyId: B.company_id, name: 'x' }); ok(r.status === 403, 'another company in the body is refused');
  r = await call('POST', '/incident-registers', adminA, { companyId: A.company_id, name: 'x' }); ok(r.status === 201, 'own company in the body works');
  r = await call('POST', '/incident-registers', adminA, { name: 'x' }); ok(r.status === 201 && r.body.created.companyId === A.company_id, 'missing body companyId is filled from the JWT before validation');
  r = await call('GET', `/incident-registers?companyId=${B.company_id}`, SUPER); ok(r.status === 200, 'SuperAdmin may address any company');
  r = await call('GET', `/invoices/${invA}`, adminA); ok(r.status === 200, 'record owned by my company: allowed');
  r = await call('GET', `/invoices/${invA}`, adminB); ok(r.status === 403 && r.body.code === 'TENANT_MISMATCH', 'record owned by another company: refused (403 TENANT_MISMATCH)');
  r = await call('GET', `/invoices/${invA}`, SUPER); ok(r.status === 200, 'SuperAdmin may open any record');
  r = await call('GET', `/invoices/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, adminB); ok(r.status === 200, 'a record that does not exist is left to the controller (it answers 404 as today)');
  r = await call('GET', `/invoices/not-a-uuid`, adminB); ok(r.status === 200, 'a malformed id is left to the controller (400/404 as today)');
  r = await call('GET', '/companies', adminA); ok(r.status === 200 && r.body.data.length === 1 && r.body.data[0].id === A.company_id, 'a customer user sees only its own company in the company list');
  r = await call('GET', '/companies', SUPER); ok(r.body.data.length === real.companies.rows.length, 'SuperAdmin still sees every company');
  r = await call('POST', '/companies', adminA, {}); ok(r.status === 403, 'a customer user cannot create another customer');
  r = await call('GET', `/companies/${B.company_id}`, adminA); ok(r.status === 403, 'a customer user cannot open another customer\'s company record');
  r = await call('GET', `/companies/${A.company_id}`, adminA); ok(r.status === 200, 'but can open its own');
  await setMode('OFF', 'OFF');

  console.log('\n[11] New customers receive the approved defaults');
  const NEWID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await db.query(`INSERT INTO companies (company_id, company_code, company_name, status, is_deleted) VALUES ($1,'NEWCO','New Customer Ltd','Active',false)`, [NEWID]);
  const newUser = JSON.stringify({ userId: 'e0000000-0000-4000-8000-000000000001', userName: 'newadmin', companyId: NEWID, permissions: PERMS });
  r = await call('GET', '/entitlements/me', newUser);
  const me = r.body.data;
  ok(JSON.stringify(me.modules) === JSON.stringify(['ADMINISTRATION', 'DASHBOARD', 'PROFILE']), 'a new customer starts with the core modules only', JSON.stringify(me.modules));
  ok(!me.modules.includes('MOBILE_APP') && !me.modules.includes('HCF_PORTAL'), 'Mobile App and HCF Portal are OFF by default for new customers');
  ok(me.features.every((f: string) => /^(DASHBOARD|PROFILE|ADMINISTRATION)\./.test(f)), 'only core features are effective');
  const nt = await tree(NEWID);
  ok(nt.totals.newItems > 300 && find(nt, 'FINANCE').isNew && find(nt, 'FINANCE').stored === null && find(nt, 'DASHBOARD').core && !find(nt, 'DASHBOARD').isNew, `every non-core item is NEW for the new customer (${nt.totals.newItems}), core items are locked`);
  await setMode('ENFORCE');
  r = await call('GET', '/invoices', newUser); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED', 'ENFORCE: a new customer cannot use Finance until SuperAdmin enables it');
  r = await call('GET', '/dashboard/kpi/total-invoices', newUser); ok(r.status === 200, 'but can use the Dashboard');
  await setMode('OFF');
  r = await save(NEWID, [{ code: 'MOBILE_APP', enabled: true }, { code: 'MOBILE_APP.HOME', enabled: true }, { code: 'MOBILE_APP.HOME.VIEW', enabled: true }]);
  ok(r.status === 200 && r.body.data.changed === 3, 'SuperAdmin activates Mobile App for the new customer');
  const me2 = (await call('GET', '/entitlements/me', newUser)).body.data;
  ok(me2.modules.includes('MOBILE_APP') && me2.features.includes('MOBILE_APP.HOME.VIEW') && !me2.submodules.includes('MOBILE_APP.SCAN'), 'only what was enabled is effective');
  const aud = (await call('GET', `/admin/entitlements/companies/${NEWID}/audit`, SUPER)).body.data.rows;
  ok(aud.length === 3 && aud.every((x: any) => x.oldValue === null && x.newValue === true), 'audit shows old value empty (first choice) and new value true');

  console.log('\n[12] Cache behaviour');
  const svc2 = new EntitlementService(repo, cfg as any, { flagsTtlMs: 400, modesTtlMs: 0, flushIntervalMs: 3600000 });
  ok(await svc2.isEntitled(B.company_id, ['REPORTS.FINANCE_BILLING.INVOICE_REPORT']), 'second process: entitled');
  await save(B.company_id, [{ code: 'REPORTS', enabled: false }]);
  ok(await svc2.isEntitled(B.company_id, ['REPORTS.FINANCE_BILLING.INVOICE_REPORT']) === true, 'another process still has the old answer immediately after the save (stale, bounded by the TTL)');
  ok(await service.isEntitled(B.company_id, ['REPORTS.FINANCE_BILLING.INVOICE_REPORT']) === false, 'the saving process sees the change immediately (cache cleared)');
  await new Promise((res) => setTimeout(res, 450));
  ok(await svc2.isEntitled(B.company_id, ['REPORTS.FINANCE_BILLING.INVOICE_REPORT']) === false, 'after the TTL the other process agrees (default TTL is 30 seconds)');
  await save(B.company_id, [{ code: 'REPORTS', enabled: true }]);

  console.log('\n[13] Existing transactions and reports unaffected');
  await setMode('OFF', 'OFF');
  r = await call('POST', '/reports/route-trip', adminA, {}); ok(r.status === 200 || r.status === 201, 'OFF: reports respond exactly as before');
  r = await call('GET', '/invoices', adminA); ok(r.status === 200 && r.body.data[0].id === 'i1', 'OFF: transactions respond exactly as before');
  ok((await db.query(`SELECT count(*)::int n FROM invoices`)).rows[0].n === 1, 'no transaction data was touched by any entitlement operation');
  const realCompanyHash = JSON.stringify((await db.query(`SELECT company_id, company_code, company_name FROM companies WHERE company_code <> 'NEWCO' ORDER BY company_id`)).rows);
  ok(realCompanyHash === JSON.stringify(real.companies.rows.map((c: any) => ({ company_id: c.company_id, company_code: c.company_code, company_name: c.company_name })).sort((x: any, y: any) => (x.company_id < y.company_id ? -1 : 1))), 'company records unchanged');

  console.log('\n[14] Channel entitlements, platform admin, company creation, tenant isolation');
  const rootNotIdentity = JSON.stringify({ userId: 'f0000000-0000-4000-8000-000000000001', userName: 'rootish', companyId: A.company_id, permissions: ['*'] });
  const hcfUser = JSON.stringify({ userId: 'a0000000-0000-4000-8000-000000000009', userName: 'hcf1', companyId: A.company_id, userType: 'HCF', hcfId: 'h1', permissions: PERMS });
  await setMode('ENFORCE', 'ENFORCE');
  r = await call('POST', '/companies', SUPER, {}); ok(!(r.status === 403 && r.body && r.body.code === 'TENANT_MISMATCH'), 'SuperAdmin is not blocked by the tenant rule when creating a company');
  r = await call('POST', '/companies', rootNotIdentity, {}); ok(!(r.status === 403 && r.body && r.body.code === 'TENANT_MISMATCH'), "a '*' (platform admin) token is not blocked either, matching the existing permission guard");
  r = await call('POST', '/companies', adminA, {}); ok(r.status === 403 && r.body.code === 'TENANT_MISMATCH', 'a customer user is refused by the tenant rule (even holding COMPANY_CREATE)');
  r = await call('POST', '/companies', nopermA, {}); ok(r.status === 403, 'a user without COMPANY_CREATE is refused (RBAC unchanged)');
  r = await call('GET', '/invoices', rootNotIdentity); ok(r.status === 200, "a '*' token is exempt from licensing like SuperAdmin");
  r = await call('GET', '/admin/entitlements/mode', rootNotIdentity); ok(r.status === 403, 'but managing entitlements stays identity-only SuperAdmin');
  await db.query(`UPDATE company_entitlements SET is_enabled=false WHERE company_id=$1 AND entity_code='HCF_PORTAL'`, [A.company_id]);
  service.invalidate(A.company_id);
  r = await call('GET', '/invoices', hcfUser); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED' && r.body.feature === 'HCF_PORTAL', 'HCF Portal disabled: HCF user token is refused by the backend');
  r = await call('GET', '/entitlements/me', hcfUser); ok(r.status === 200, 'the entitlement endpoint itself still answers so the UI can show the reason');
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'normal users of the same customer are unaffected');
  await db.query(`UPDATE company_entitlements SET is_enabled=true WHERE company_id=$1 AND entity_code='HCF_PORTAL'`, [A.company_id]);
  service.invalidate(A.company_id);
  r = await call('GET', '/invoices', hcfUser); ok(r.status === 200, 'HCF Portal re-enabled: HCF user works again');
  r = await call('GET', `/invoices/${invA}`, adminB); ok(r.status === 403, 'tenant B cannot read tenant A invoice');
  r = await call('GET', `/companies/${A.company_id}`, adminB); ok(r.status === 403, 'tenant B cannot open tenant A company');
  r = await call('GET', `/incident-registers?companyId=${A.company_id}`, adminB); ok(r.status === 403, 'tenant B cannot list tenant A register by companyId');
  await setMode('OFF', 'OFF');

  console.log('\n[15] Signed channel claims (Mobile App / HCF Portal), every endpoint');
  await db.exec(`DROP TABLE IF EXISTS fleets; CREATE TABLE fleets (fleet_id uuid PRIMARY KEY, company_id uuid);
    DROP TABLE IF EXISTS hcfs; CREATE TABLE hcfs (hcf_id uuid PRIMARY KEY, company_id uuid);
    DROP TABLE IF EXISTS vehicle_waste_collections; CREATE TABLE vehicle_waste_collections (vehicle_waste_collection_id uuid PRIMARY KEY, vehicle_id uuid);
    DROP TABLE IF EXISTS compliance_register; CREATE TABLE compliance_register (id uuid PRIMARY KEY, company_id uuid)`);
  const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const HCF_NOCLAIM = U(900);
  await db.query(`INSERT INTO hcfs VALUES ($1,$2)`, [HCF_NOCLAIM, A.company_id]);
  const mobileA = JSON.stringify({ userId: 'a0000000-0000-4000-8000-000000000003', userName: 'mob', companyId: A.company_id, permissions: PERMS, channel: 'MOBILE' });
  const hcfClaim = JSON.stringify({ userId: U(901), userName: 'hcfc', companyId: A.company_id, permissions: PERMS, channel: 'HCF_PORTAL', userType: 'HCF' });
  const hcfNoClaim = JSON.stringify({ userId: HCF_NOCLAIM, userName: 'hcfn', companyId: A.company_id, permissions: PERMS });
  await setMode('ENFORCE', 'OFF');
  r = await call('GET', '/invoices', mobileA); ok(r.status === 200, 'Mobile App enabled: a mobile-channel token works');
  await db.query(`UPDATE company_entitlements SET is_enabled=false WHERE company_id=$1 AND entity_code IN ('MOBILE_APP','HCF_PORTAL')`, [A.company_id]);
  service.invalidate(A.company_id);
  r = await call('GET', '/invoices', mobileA); ok(r.status === 403 && r.body.code === 'FEATURE_NOT_LICENSED' && r.body.feature === 'MOBILE_APP' && /Mobile App is not enabled/.test(r.body.message), 'Mobile App disabled: the signed mobile-channel token is refused with a clear message');
  r = await call('GET', '/invoices', adminA); ok(r.status === 200, 'desktop-channel token of the same customer is unaffected');
  r = await call('GET', '/invoices', adminA, undefined, { 'x-client-channel': 'mobile' }); ok(r.status === 200, 'the old X-Client-Channel header has no effect any more (it is not a security boundary)');
  r = await call('GET', '/entitlements/me', mobileA); ok(r.status === 200, 'the mobile app can still read its entitlement state');
  r = await call('GET', '/invoices', SUPER); ok(r.status === 200, 'SuperAdmin exempt');
  r = await call('GET', '/invoices', hcfClaim); ok(r.status === 403 && r.body.feature === 'HCF_PORTAL' && /HCF Portal is not enabled/.test(r.body.message), 'HCF Portal disabled: token with the HCF claim is refused with a clear message');
  r = await call('GET', '/invoices', hcfNoClaim); ok(r.status === 403 && r.body.feature === 'HCF_PORTAL', 'HCF Portal disabled: an HCF account whose token has no claim (issued before this release) is refused too');
  r = await call('GET', '/dashboard/kpi/total-invoices', hcfClaim); ok(r.status === 403, 'HCF Portal disabled: dashboard data is refused');
  r = await call('GET', '/brandnew', hcfClaim); ok(r.status === 403, 'HCF Portal disabled: an endpoint without mapping is refused');
  // every endpoint of the mapping table, HCF disabled and Mobile disabled
  const map = await service.getEndpointMap();
  const OPEN = new Set(['entitlement-me', 'auth', 'permissions', 'branding']);
  const interceptor = new EntitlementInterceptor(service, new TenantOwnershipService(dsFake as any, dsFake as any));
  const attempt = async (user: any, row: any) => {
    const path = row.routePattern;
    const req: any = { user, method: row.httpMethod, route: { path }, headers: {}, query: {}, body: {}, params: {} };
    const ctx: any = { getType: () => 'http', switchToHttp: () => ({ getRequest: () => req }) };
    try { await lastValueFrom(interceptor.intercept(ctx, { handle: () => of('handled') })); return 'ALLOWED'; } catch (e: any) { return e instanceof ForbiddenException ? (e.getResponse() as any).feature || 'FORBIDDEN' : 'ERROR'; }
  };
  let hcfRefused = 0, hcfChecked = 0, mobRefused = 0, mobChecked = 0, leaked: string[] = [];
  for (const row of map.values()) {
    if (row.controller && OPEN.has(row.controller)) continue;
    if (row.controller === 'entitlement-admin') continue; // blocked by its own SuperAdmin-only guard
    hcfChecked++; mobChecked++;
    const h = await attempt(JSON.parse(hcfClaim), row); if (h === 'HCF_PORTAL') hcfRefused++; else leaked.push(`HCF ${row.httpMethod} ${row.routePattern} -> ${h}`);
    const m = await attempt(JSON.parse(mobileA), row); if (m === 'MOBILE_APP') mobRefused++; else leaked.push(`MOB ${row.httpMethod} ${row.routePattern} -> ${m}`);
  }
  ok(hcfChecked > 300 && hcfRefused === hcfChecked, `HCF Portal disabled: ALL ${hcfChecked} authenticated endpoints refuse an HCF session (including the exempt notification/sample/invoice-download routes)`, leaked.slice(0, 5).join('; '));
  ok(mobRefused === mobChecked, `Mobile App disabled: ALL ${mobChecked} authenticated endpoints refuse a mobile-channel session`, leaked.slice(0, 5).join('; '));
  await db.query(`UPDATE company_entitlements SET is_enabled=true WHERE company_id=$1 AND entity_code IN ('MOBILE_APP','HCF_PORTAL')`, [A.company_id]);
  service.invalidate(A.company_id);
  r = await call('GET', '/invoices', hcfClaim); ok(r.status === 200, 'HCF Portal re-enabled: the HCF session works again');
  r = await call('GET', '/invoices', mobileA); ok(r.status === 200, 'Mobile App re-enabled: the mobile session works again');
  await setMode('OFF', 'OFF');

  console.log('\n[16] Tenant isolation: vehicle collections (via fleet), compliance register, username lookup');
  const [fA, fB, fO] = [U(10), U(11), U(12)];
  await db.query(`INSERT INTO fleets VALUES ($1,$2),($3,$4),($5,NULL)`, [fA, A.company_id, fB, B.company_id, fO]);
  const [vA, vB, vO] = [U(20), U(21), U(22)];
  await db.query(`INSERT INTO vehicle_waste_collections VALUES ($1,$2),($3,$4),($5,$6)`, [vA, fA, vB, fB, vO, fO]);
  const [cA, cB, cN] = [U(30), U(31), U(32)];
  await db.query(`INSERT INTO compliance_register VALUES ($1,$2),($3,$4),($5,NULL)`, [cA, A.company_id, cB, B.company_id, cN]);
  await setMode('OFF', 'ENFORCE');
  r = await call('GET', '/vehicle-waste-collections', adminA); ok(r.status === 200 && r.body.data.length === 1 && r.body.data[0].vehicleId === fA, 'vehicle list: customer A sees only its own fleet\'s collections');
  r = await call('GET', '/vehicle-waste-collections', adminB); ok(r.body.data.length === 1 && r.body.data[0].vehicleId === fB, 'vehicle list: customer B sees only its own');
  r = await call('GET', '/vehicle-waste-collections', SUPER); ok(r.body.data.length === 3, 'vehicle list: SuperAdmin sees all');
  for (const [m, p, who, exp, name] of [
    ['GET', `/vehicle-waste-collections/${vA}`, adminA, 200, 'A reads its own'], ['GET', `/vehicle-waste-collections/${vB}`, adminA, 403, 'A cannot read B\'s'],
    ['GET', `/vehicle-waste-collections/${vO}`, adminA, 403, 'A cannot read a collection whose vehicle has no company'],
    ['PUT', `/vehicle-waste-collections/${vB}`, adminA, 403, 'A cannot update B\'s'], ['PUT', `/vehicle-waste-collections/${vB}/submit`, adminA, 403, 'A cannot submit B\'s'],
    ['PUT', `/vehicle-waste-collections/${vB}/verify`, adminA, 403, 'A cannot verify B\'s'], ['DELETE', `/vehicle-waste-collections/${vB}`, adminA, 403, 'A cannot delete B\'s'],
    ['DELETE', `/vehicle-waste-collections/${vA}`, adminA, 200, 'A deletes its own'], ['GET', `/vehicle-waste-collections/${vB}`, adminB, 200, 'B reads its own'],
    ['GET', `/vehicle-waste-collections/${vA}`, SUPER, 200, 'SuperAdmin reads any'],
  ] as any[]) { r = await call(m, p, who, m === 'PUT' ? {} : undefined); ok(r.status === exp, `vehicle: ${name}`, String(r.status)); }
  r = await call('POST', '/vehicle-waste-collections', adminA, { vehicleId: fB }); ok(r.status === 403, 'vehicle create: A cannot record a collection for B\'s vehicle');
  r = await call('POST', '/vehicle-waste-collections', adminA, { vehicleId: fA }); ok(r.status === 201, 'vehicle create: A can for its own vehicle');
  r = await call('POST', '/vehicle-waste-collections', adminA, { vehicleId: fO }); ok(r.status === 403, 'vehicle create: a vehicle without a company is refused');
  r = await call('GET', `/vehicle-waste-collections?vehicleId=${fB}`, adminA); ok(r.status === 403, 'vehicle list: asking for another customer\'s vehicle is refused');
  r = await call('GET', '/compliance', adminA); ok(r.status === 200 && r.body.length === 1 && r.body[0].id === cA, 'compliance list: A sees only its own register rows (unattributed rows are hidden)');
  r = await call('GET', '/compliance', SUPER); ok(r.body.length === 3, 'compliance list: SuperAdmin sees all including unattributed');
  for (const [m, p, who, exp, name] of [
    ['GET', `/compliance/${cA}`, adminA, 200, 'A reads its own'], ['GET', `/compliance/${cB}`, adminA, 403, 'A cannot read B\'s'], ['GET', `/compliance/${cN}`, adminA, 403, 'A cannot read an unattributed row'],
    ['PATCH', `/compliance/${cB}`, adminA, 403, 'A cannot edit B\'s'], ['DELETE', `/compliance/${cB}`, adminA, 403, 'A cannot delete B\'s'], ['GET', `/compliance/${cN}`, SUPER, 200, 'SuperAdmin reads an unattributed row'],
  ] as any[]) { r = await call(m, p, who, m === 'PATCH' ? {} : undefined); ok(r.status === exp, `compliance: ${name}`, String(r.status)); }
  await setMode('OFF', 'SHADOW');
  r = await call('GET', `/vehicle-waste-collections/${vB}`, adminA); ok(r.status === 200, 'SHADOW: the cross-customer read is allowed...');
  await service.flushNow();
  ok((await db.query(`SELECT count(*)::int n FROM entitlement_shadow_log WHERE reason='TENANT_MISMATCH' AND route_pattern='/vehicle-waste-collections/:id'`)).rows[0].n >= 1, '...and recorded as a would-be block');
  await setMode('OFF', 'OFF');
  r = await call('GET', `/vehicle-waste-collections/${vB}`, adminA); ok(r.status === 200, 'OFF: behaviour exactly as before');
  ok((await db.query(`SELECT count(*)::int n FROM entitlement_coverage_daily e WHERE false`)).rows[0].n === 0, 'coverage query runs');
  // username lookup (scoped inside the controller / use case)
  const seen: any[] = [];
  const uc = { execute: async (name: string, scope?: string) => { seen.push(scope); return { userName: name }; } };
  const fakeCtl: any = { getUserByUsernameUseCase: uc };
  const lookup = (user: any, q?: string) => (UserController.prototype as any).findByUsername.call(fakeCtl, 'alice', { user }, q);
  await lookup({ userId: 'x', companyId: A.company_id, permissions: ['USER_VIEW'] }); ok(seen.pop() === A.company_id, 'username lookup: a customer user is limited to its own company');
  await lookup({ userId: 'x', companyId: A.company_id, permissions: ['USER_VIEW'] }, B.company_id); ok(seen.pop() === A.company_id, 'username lookup: a customer user cannot ask for another company');
  await lookup({ userId: '00000000-0000-0000-0000-000000000001', companyId: '00000000-0000-0000-0000-000000000000', permissions: ['*'] }); ok(seen.pop() === undefined, 'username lookup: SuperAdmin searches all companies by default');
  await lookup({ userId: '00000000-0000-0000-0000-000000000001', companyId: '00000000-0000-0000-0000-000000000000', permissions: ['*'] }, B.company_id); ok(seen.pop() === B.company_id, 'username lookup: SuperAdmin may pass an optional companyId');
  const qbCalls: any[] = [];
  const qb: any = { where() { return qb; }, andWhere(s: string, p: any) { qbCalls.push([s, p]); return qb; }, getOne: async () => null };
  const ucReal = new GetUserByUsernameUseCase({} as any, { getRepository: () => ({ createQueryBuilder: () => qb }) } as any);
  await ucReal.execute('alice', A.company_id).catch(() => undefined);
  ok(qbCalls.some(([s, p]) => /companyId/.test(s) && p.companyId === A.company_id), 'username use case: the query is restricted by companyId when scoped');
  qbCalls.length = 0; await ucReal.execute('alice').catch(() => undefined);
  ok(!qbCalls.some(([s]) => /companyId/.test(s)), 'username use case: not restricted for platform administrators');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await app.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
