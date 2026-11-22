/**
 * Builds everything derived from the catalogue definition:
 *   migrations/entitlements_002_catalogue_seed.sql   catalogue + endpoint mapping (idempotent upserts)
 *   migrations/entitlements_004_permission_codes.sql 59 missing permission codes (assigned to NO role)
 *   docs/entitlements/endpoint-mapping-review.csv     every endpoint -> feature(s), for your sign-off
 *   docs/entitlements/catalogue-review.csv            every module / submodule / feature
 *   <frontend>/src/utils/routeEntitlements.generated.ts  route -> code map (when --frontend is given)
 *
 * It FAILS (exit 1) if any controller endpoint has no mapping, so a new route can never ship unmapped.
 *
 * Usage (backend folder):  node scripts/entitlements/build-seed.js [--frontend <frontend/frontend path>]
 */
const fs = require('fs');
const path = require('path');
const { RELEASE, modules, submodules, moduleRoutes } = require('./catalogue');

const BACKEND = path.resolve(__dirname, '../..');
const MODULES_DIR = path.join(BACKEND, 'src/modules');

// ------------------------------------------------------------------ catalogue -> nodes
const nodes = { modules: [], submodules: [], features: [] };
modules.forEach((m) => nodes.modules.push({ code: m.code, name: m.name, core: !!m.core, sort: m.sort }));
submodules.forEach((s, i) => {
  const subCode = `${s.module}.${s.code}`;
  nodes.submodules.push({ code: subCode, module: s.module, name: s.name, route: s.routes[0] || null, routes: s.routes, sort: (i + 1) * 10, core: !!s.core });
  s.features.forEach((f, j) => {
    nodes.features.push({ code: `${subCode}.${f.code}`, submodule: subCode, name: f.name, type: f.type, enforcement: f.enforcement, perm: f.perm || null, sort: (j + 1) * 10, routes: f.routes || [], apis: f.apis || [] });
  });
});
const featureByCode = new Map(nodes.features.map((f) => [f.code, f]));
const featuresByPerm = new Map();
nodes.features.forEach((f) => { if (f.perm) { if (!featuresByPerm.has(f.perm)) featuresByPerm.set(f.perm, []); featuresByPerm.get(f.perm).push(f.code); } });
const must = (code) => { if (!featureByCode.has(code) && !nodes.submodules.find((s) => s.code === code) && !nodes.modules.find((m) => m.code === code)) throw new Error(`mapping refers to unknown code ${code}`); return code; };
const F = (...codes) => codes.map(must);

// all report export features (any-of) used by the shared backend export endpoints
const ALL_EXPORTS = nodes.features.filter((f) => f.code.startsWith('REPORTS.') && /\.EXPORT_(PDF|EXCEL|CSV)$/.test(f.code)).map((f) => f.code);
const reportApi = new Map();
nodes.features.forEach((f) => f.apis.forEach((a) => reportApi.set(a, f.code)));

// ------------------------------------------------------------------ scan controllers
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; }
const allFiles = walk(MODULES_DIR);
const dtoHasCompany = new Map();
allFiles.filter((f) => /\.dto\.ts$/.test(f)).forEach((f) => {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/export class (\w+)[^{]*\{([\s\S]*?)\n\}/g)) dtoHasCompany.set(m[1], /\bcompanyId\b/.test(m[2]));
});

function scanControllers() {
  const rows = [];
  for (const f of allFiles.filter((x) => /\.controller\.ts$/.test(x))) {
    // strip comments first: a JSDoc line such as "before @Get(':id')" must not be read as a route
    const s = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const cm = s.match(/@Controller\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/);
    const prefix = cm ? cm[1] || '' : '';
    const cls = s.match(/@RequirePermissions\(([^)]*)\)\s*\n(?:\s*@[^\n]*\n)*\s*export class/);
    const classPerm = cls ? cls[1].replace(/['"\s]/g, '') : null;
    const re = /@(Get|Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)([\s\S]*?)\n[ \t]*(?:public\s+|private\s+)?(?:async\s+)?(\w+)\s*\(([\s\S]{0,700}?)\)\s*(?::[^{]*)?\{/g;
    let m;
    while ((m = re.exec(s))) {
      const between = m[3];
      const pm = between.match(/@RequirePermissions\(([^)]*)\)/);
      const params = m[5];
      const bodyType = /@Body\([^)]*\)\s*\w+\s*:\s*(\w+)/.exec(params);
      rows.push({
        controller: path.basename(f).replace('.controller.ts', ''),
        method: m[1].toUpperCase(),
        path: '/' + [prefix, m[2] || ''].filter(Boolean).join('/'),
        perm: pm ? pm[1].replace(/['"\s]/g, '') : classPerm || null,
        handler: m[4],
        queryCompany: /@Query\(\s*['"]companyId['"]\s*\)/.test(params),
        bodyCompany: bodyType ? !!dtoHasCompany.get(bodyType[1]) : false,
      });
    }
  }
  return rows;
}

// ------------------------------------------------------------------ mapping rules
const REGISTERS = {
  'autoclave-register': 'TRANSACTION.AUTOCLAVE_REGISTER', 'compliance-register': 'COMPLIANCE.COMPLIANCE_REGISTER',
  'disposal-register': 'TRANSACTION.DISPOSAL_REGISTER', 'downtime-register': 'TRANSACTION.DOWNTIME_REGISTER',
  'emission-register': 'TRANSACTION.EMISSION_REGISTER', 'etp-register': 'TRANSACTION.ETP_REGISTER',
  'incident-register': 'TRANSACTION.INCIDENT_REGISTER', 'incineration-register': 'TRANSACTION.INCINERATION_REGISTER',
  'shredder-register': 'TRANSACTION.SHREDDER_REGISTER',
};
const FIN_VIEWS = F('FINANCE.INVOICE_MGMT.VIEW', 'FINANCE.INVOICE_GENERATION.VIEW', 'FINANCE.PAYMENT.VIEW', 'FINANCE.RECEIPT_MGMT.VIEW', 'FINANCE.FIN_BALANCE.VIEW');

function classify(e) {
  const x = (features, source = 'EXPLICIT') => ({ features: F(...features), source });
  const exempt = (reason, extra = {}) => ({ features: null, source: 'EXEMPT', reason, ...extra });
  const p = e.path;
  switch (e.controller) {
    case 'auth': return exempt('Authentication and session endpoints');
    case 'entitlement-admin': return exempt('Entitlement management (SuperAdmin only, enforced by its own guard)');
    case 'entitlement-me': return exempt('The own-customer entitlement list of the logged-in user');
    case 'notification': return exempt('Per-user notifications');
    case 'sample': return exempt('Deprecated demo controller, no usage found; removal needs approval after the shadow period', { deprecated: true });
    case 'branding': return exempt('Application Branding (SuperAdmin only, not licensable)');
    case 'permissions': if (p === '/permissions/me') return exempt('Current user permissions'); break;
    case 'hcf-auth':
      if (p.endsWith('/change-password')) return x(['HCF_PORTAL.PASSWORD_MGMT.CHANGE_PASSWORD']);
      if (p.startsWith('/hcf-auth/admin/reset-password')) return x(['MASTER.HCF.RESET_PORTAL_PASSWORD']);
      return exempt('Public HCF portal endpoint (no authenticated user)');
    case 'dashboard':
      if (/^\/dashboard\/kpi\//.test(p)) return x(['DASHBOARD.HOME.KPI_WIDGETS']);
      if (/^\/dashboard\/chart\//.test(p)) return x(['DASHBOARD.HOME.CHART_WIDGETS']);
      if (/^\/dashboard\/table\//.test(p)) return x(['DASHBOARD.HOME.TABLE_WIDGETS']);
      if (/^\/dashboard\/tasks\//.test(p)) return x(['DASHBOARD.HOME.TASK_WIDGETS']);
      if (/^\/dashboard\/alerts\//.test(p)) return x(['DASHBOARD.HOME.ALERT_WIDGETS']);
      if (e.perm === 'DASHBOARD_CONFIG_UPDATE') return exempt('Dashboard Configuration (SuperAdmin area, not licensable)');
      return x(['DASHBOARD.HOME.VIEW']);
    case 'export': return x(ALL_EXPORTS);
    case 'reports': {
      if (p === '/reports/export') return x(ALL_EXPORTS);
      const seg = p.replace('/reports/', '');
      if (reportApi.has(seg)) return x([reportApi.get(seg)]);
      break;
    }
    case 'invoice':
      if (p === '/invoices' && e.method === 'POST') return x(['FINANCE.INVOICE_MGMT.CREATE']);
      if (p === '/invoices/generate') return x(['FINANCE.INVOICE_GENERATION.AUTO_GENERATE']);
      if (p === '/invoices/generate-weight') return x(['FINANCE.INVOICE_GENERATION.GENERATE_BY_WEIGHT']);
      if (p === '/invoices/generate-month') return x(['FINANCE.INVOICE_GENERATION.GENERATE_BY_MONTH']);
      if (/\/pdf(\/base64)?$/.test(p) && e.method === 'GET') return x(['FINANCE.INVOICE_MGMT.DOWNLOAD_PDF', 'FINANCE.INVOICE_MGMT.PRINT']);
      if (/^\/invoices\/pdf\/bulk/.test(p)) return x(['FINANCE.INVOICE_MGMT.BULK_ZIP']);
      if (p === '/invoices/:id/post') return x(['FINANCE.INVOICE_MGMT.POST']);
      if (p === '/invoices/:id' && e.method === 'PUT') return x(['FINANCE.INVOICE_MGMT.EDIT']);
      if (p === '/invoices/:id' && e.method === 'DELETE') return x(['FINANCE.INVOICE_MGMT.DELETE']);
      if (e.method === 'GET') return x(FIN_VIEWS); // shared by invoice, payment, receipt and balance screens
      break;
    case 'batch':
      if (e.method === 'GET') return x(['FINANCE.INVOICE_GENERATION.VIEW', 'FINANCE.INVOICE_MGMT.VIEW']);
      if (p === '/billing/batches/draft-invoices/:invoiceId') return x(['FINANCE.INVOICE_GENERATION.EDIT_DRAFT']);
      if (/post$/.test(p)) return x(['FINANCE.INVOICE_GENERATION.POST_BATCH']);
      return x(['FINANCE.INVOICE_GENERATION.AUTO_GENERATE', 'FINANCE.INVOICE_GENERATION.GENERATE_BY_MONTH', 'FINANCE.INVOICE_GENERATION.GENERATE_BY_WEIGHT']);
    case 'payment':
      if (p === '/payments/record') return x(['FINANCE.PAYMENT.RECORD_PAYMENT']);
      if (p === '/payments' && e.method === 'POST') return x(['FINANCE.PAYMENT.PROCESS_PAYMENT']);
      if (p === '/payments/receipts/manual') return x(['FINANCE.RECEIPT_MGMT.ADD_RECEIPT']);
      return x(['FINANCE.PAYMENT.VIEW', 'FINANCE.RECEIPT_MGMT.VIEW', 'FINANCE.INVOICE_MGMT.VIEW']);
    case 'fin-balance':
      if (/bulk-upload/.test(p)) return x(['FINANCE.FIN_BALANCE.BULK_UPLOAD']);
      if (e.method === 'GET') return x(['FINANCE.FIN_BALANCE.VIEW']);
      if (e.method === 'POST') return x(['FINANCE.FIN_BALANCE.CREATE']);
      if (e.method === 'PUT') return x(['FINANCE.FIN_BALANCE.EDIT']);
      return x(['FINANCE.FIN_BALANCE.DELETE']);
    case 'barcode-label':
      if (e.method === 'GET') return x(['TRANSACTION.BARCODE_GENERATION.VIEW', 'TRANSACTION.BARCODE_LIST.VIEW']);
      break;
    case 'agreement': if (p === '/agreements/:id/download') return x(['COMMERCIAL.AGREEMENT.DOWNLOAD_PDF']); break;
    case 'user':
      if (p === '/users/:id/reset-password') return x(['ADMINISTRATION.USER_MGMT.RESET_PASSWORD']);
      if (p === '/users/:id/change-password') return x(['PROFILE.MY_PROFILE.CHANGE_PASSWORD', 'ADMINISTRATION.USER_MGMT.EDIT']);
      break;
    default: break;
  }
  if (REGISTERS[e.controller]) {
    const verb = { GET: 'VIEW', POST: 'CREATE', PATCH: 'EDIT', PUT: 'EDIT', DELETE: 'DELETE' }[e.method];
    return x([`${REGISTERS[e.controller]}.${verb}`]);
  }
  if (e.perm) {
    const hit = featuresByPerm.get(e.perm);
    if (hit && hit.length === 1) return { features: hit, source: 'DERIVED' };
    if (hit && hit.length > 1) throw new Error(`permission ${e.perm} maps to several features (${hit.join(', ')}); add an explicit rule for ${e.method} ${e.path}`);
  }
  return null;
}

// ------------------------------------------------------------------ tenant ownership registry
const M = 'master', T = 'transaction';
const direct = (db, table, pk) => ({ mode: 'DIRECT', db, table, pk });
const OWNERSHIP = {
  user: direct(M, 'users', 'user_id'), role: direct(M, 'roles', 'role_id'), category: direct(M, 'categories', 'category_id'),
  color: direct(M, 'colors', 'color_id'), equipment: direct(M, 'equipment_master', 'equipment_id'), fleet: direct(M, 'fleets', 'fleet_id'),
  frequency: direct(M, 'frequencies', 'frequency_id'), hcf: direct(M, 'hcfs', 'hcf_id'), 'hcf-type': direct(M, 'hcf_types', 'hcf_type_id'),
  route: direct(M, 'routes', 'route_id'), 'route-hcf': direct(M, 'route_hcf_mappings', 'route_hcf_id'),
  'autoclave-register': direct(T, 'autoclave_registers', 'autoclave_id'), 'disposal-register': direct(T, 'disposal_registers', 'disposal_id'),
  'downtime-register': direct(T, 'downtime_registers', 'downtime_id'), 'emission-register': direct(T, 'emission_registers', 'emission_id'),
  'etp-register': direct(T, 'etp_registers', 'etp_id'), 'incident-register': direct(T, 'incident_registers', 'incident_id'),
  'incineration-register': direct(T, 'incineration_registers', 'incineration_id'), 'shredder-register': direct(T, 'shredder_registers', 'shredder_id'),
  'barcode-label': direct(T, 'barcode_labels', 'barcode_label_id'), contract: direct(T, 'contracts', 'contract_id'),
  invoice: direct(T, 'invoices', 'invoice_id'), payment: direct(T, 'payments', 'payment_id'), 'fin-balance': direct(T, 'fin_balance', 'fin_balance_id'),
  'route-assignment': direct(T, 'route_assignments', 'route_assignment_id'), 'training-certificate': direct(T, 'training_certificates', 'certificate_id'),
  'waste-collection': direct(T, 'waste_collections', 'waste_collection_id'), 'waste-process': direct(T, 'waste_processes', 'waste_process_id'),
  'waste-transaction': direct(T, 'waste_transactions', 'waste_transaction_id'), batch: direct(T, 'invoice_batch', 'id'),
  company: { mode: 'SELF' },
  'hcf-amendment': { mode: 'VIA', db: M, table: 'hcf_amendments', pk: 'hcf_amendment_id', viaSql: 'SELECT h.company_id FROM hcf_amendments a JOIN hcfs h ON h.hcf_id = a.hcf_id WHERE a.hcf_amendment_id = $1' },
  agreement: { mode: 'VIA', db: T, table: 'agreements', pk: 'agreement_id', viaSql: 'SELECT c.company_id FROM agreements a JOIN contracts c ON c.contract_id = a.contract_id WHERE a.agreement_id = $1' },
  state: { mode: 'GLOBAL' }, district: { mode: 'GLOBAL' }, area: { mode: 'GLOBAL' }, 'pcb-zone': { mode: 'GLOBAL' }, 'finance-year': { mode: 'GLOBAL' },
  'placeholder-master': { mode: 'GLOBAL' }, 'agreement-template': { mode: 'GLOBAL' }, 'agreement-clause': { mode: 'GLOBAL' },
  // owner = company of the fleet the collection belongs to (transaction row -> vehicle_id -> master fleets.company_id)
  'vehicle-waste-collection': { mode: 'VIA_FLEET', db: T, table: 'vehicle_waste_collections', pk: 'vehicle_waste_collection_id' },
  // company_id added by entitlements_006; rows without a company are visible to platform administrators only
  'compliance-register': { mode: 'DIRECT_STRICT', db: T, table: 'compliance_register', pk: 'id' },
};
const OVERRIDES = [
  [/^\/payments\/receipts\/:id$/, direct(T, 'receipts', 'receipt_id'), 'id'],
  [/^\/payments\/invoice\/:invoiceId$/, direct(T, 'invoices', 'invoice_id'), 'invoiceId'],
  [/^\/billing\/batches\/draft-invoices\/:invoiceId$/, direct(T, 'invoices', 'invoice_id'), 'invoiceId'],
  [/^\/hcf-auth\/admin\/reset-password\/:hcfId$/, direct(M, 'hcfs', 'hcf_id'), 'hcfId'],
  [/^\/users\/company\/:companyId$/, { mode: 'PARAM_IS_COMPANY' }, 'companyId'],
  // scoped inside the controller: customer users are limited to their own company, SuperAdmin may pass ?companyId
  [/^\/users\/username\/:userName$/, { mode: 'IN_CODE', note: 'Scoped to the caller company inside UserController.findByUsername' }, 'userName'],
  [/^\/permissions\/roles\/:roleId$/, direct(M, 'roles', 'role_id'), 'roleId'],
];
function ownership(e, cls) {
  if (cls.source === 'EXEMPT') return null;
  const params = [...e.path.matchAll(/:(\w+)/g)].map((m) => m[1]);
  // the company collection itself: a customer may list only its own company and may not create another one
  if (params.length === 0) {
    if (e.controller === 'company' && e.path === '/companies') return { mode: 'SELF' };
    // list / create of the two resources whose owner is derived rather than stored on the row
    if (e.controller === 'vehicle-waste-collection' || e.controller === 'compliance-register') return { ...OWNERSHIP[e.controller] };
    return null;
  }
  for (const [re, res, param] of OVERRIDES) if (re.test(e.path)) return { ...res, param };
  if (e.controller === 'dashboard') return null;
  const res = OWNERSHIP[e.controller];
  if (!res) return { mode: 'UNSCOPED', param: params[0], note: `No ownership rule for controller ${e.controller}` };
  return { ...res, param: params[0] };
}

// ------------------------------------------------------------------ build
const endpoints = scanControllers();
// token links live on an array route that the scanner does not see; recorded for completeness
endpoints.push(
  { controller: 'invoice-download', method: 'GET', path: '/download/bulk/:token', perm: null, handler: 'download' },
  { controller: 'invoice-download', method: 'GET', path: '/invoice-downloads/:token', perm: null, handler: 'download' },
);
const mapped = [];
const problems = [];
for (const e of endpoints) {
  let cls;
  try { cls = e.controller === 'invoice-download' ? { features: null, source: 'EXEMPT', reason: 'Token link; entitlement is re-checked when the link is used' } : classify(e); } catch (err) { problems.push(err.message); continue; }
  if (!cls) { problems.push(`UNMAPPED ${e.method} ${e.path} (${e.controller}.${e.handler}, permission ${e.perm || 'none'})`); continue; }
  mapped.push({ ...e, ...cls, tenant: ownership(e, cls) });
}
if (problems.length) {
  console.error(`\n${problems.length} endpoint(s) cannot be mapped:\n  ` + problems.join('\n  '));
  process.exit(1);
}

const CHECK = process.argv.includes('--check');
const stale = [];
/** Writes a generated file, or (with --check) only compares it with what is on disk. */
function emit(file, content) {
  if (CHECK) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current !== content) stale.push(path.relative(BACKEND, file));
    return;
  }
  fs.writeFileSync(file, content);
}

const q = (s) => (s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const b = (v) => (v ? 'TRUE' : 'FALSE');

// ---- seed SQL
const lines = [];
lines.push(`-- Customer Entitlements - catalogue and endpoint mapping seed (release ${RELEASE})`);
lines.push('-- GENERATED by scripts/entitlements/build-seed.js - do not edit by hand; change scripts/entitlements/catalogue.js and regenerate.');
lines.push('-- Idempotent upserts. Adds catalogue rows only: it never creates or changes any company entitlement row.');
lines.push('-- Run AFTER entitlements_001_schema.sql. Not executed by the application.', '');
lines.push('SET lock_timeout = \'5s\';', '');
lines.push('INSERT INTO application_modules (module_code, module_name, sort_order, is_core, introduced_in) VALUES');
lines.push(nodes.modules.map((m) => `  (${q(m.code)}, ${q(m.name)}, ${m.sort}, ${b(m.core)}, ${q(RELEASE)})`).join(',\n'));
lines.push('ON CONFLICT (module_code) DO UPDATE SET module_name = EXCLUDED.module_name, sort_order = EXCLUDED.sort_order, is_core = EXCLUDED.is_core, status = \'Active\';', '');
lines.push('INSERT INTO application_submodules (module_id, submodule_code, submodule_name, route_prefix, sort_order, is_core, introduced_in)');
lines.push('SELECT m.module_id, v.code, v.name, v.route, v.sort, v.core, v.rel FROM (VALUES');
lines.push(nodes.submodules.map((s) => `  (${q(s.module)}, ${q(s.code)}, ${q(s.name)}, ${q(s.route)}, ${s.sort}, ${b(s.core)}, ${q(RELEASE)})`).join(',\n'));
lines.push(') AS v(module_code, code, name, route, sort, core, rel) JOIN application_modules m ON m.module_code = v.module_code');
lines.push('ON CONFLICT (submodule_code) DO UPDATE SET submodule_name = EXCLUDED.submodule_name, route_prefix = EXCLUDED.route_prefix, sort_order = EXCLUDED.sort_order, is_core = EXCLUDED.is_core, status = \'Active\';', '');
lines.push('INSERT INTO application_features (submodule_id, feature_code, feature_name, feature_type, enforcement, permission_code, sort_order, introduced_in)');
lines.push('SELECT s.submodule_id, v.code, v.name, v.type, v.enf, v.perm, v.sort, v.rel FROM (VALUES');
lines.push(nodes.features.map((f) => `  (${q(f.submodule)}, ${q(f.code)}, ${q(f.name)}, ${q(f.type)}, ${q(f.enforcement)}, ${q(f.perm)}, ${f.sort}, ${q(RELEASE)})`).join(',\n'));
lines.push(') AS v(sub_code, code, name, type, enf, perm, sort, rel) JOIN application_submodules s ON s.submodule_code = v.sub_code');
lines.push('ON CONFLICT (feature_code) DO UPDATE SET feature_name = EXCLUDED.feature_name, feature_type = EXCLUDED.feature_type, enforcement = EXCLUDED.enforcement, permission_code = EXCLUDED.permission_code, sort_order = EXCLUDED.sort_order, status = \'Active\';', '');
lines.push('INSERT INTO endpoint_feature_map (http_method, route_pattern, feature_code, exempt_reason, mapping_source, controller, permission_code, tenant_mode, tenant_db, tenant_table, tenant_pk, tenant_param, tenant_via_sql, body_has_company, query_has_company, deprecated) VALUES');
lines.push(mapped.map((e) => {
  const t = e.tenant || {};
  return `  (${q(e.method)}, ${q(e.path)}, ${q(e.features ? e.features.join('|') : null)}, ${q(e.reason || null)}, ${q(e.source)}, ${q(e.controller)}, ${q(e.perm)}, ${q(t.mode || null)}, ${q(t.db || null)}, ${q(t.table || null)}, ${q(t.pk || null)}, ${q(t.param || null)}, ${q(t.viaSql || null)}, ${b(e.bodyCompany)}, ${b(e.queryCompany)}, ${b(e.deprecated)})`;
}).join(',\n'));
lines.push('ON CONFLICT (http_method, route_pattern) DO UPDATE SET feature_code = EXCLUDED.feature_code, exempt_reason = EXCLUDED.exempt_reason, mapping_source = EXCLUDED.mapping_source, controller = EXCLUDED.controller, permission_code = EXCLUDED.permission_code, tenant_mode = EXCLUDED.tenant_mode, tenant_db = EXCLUDED.tenant_db, tenant_table = EXCLUDED.tenant_table, tenant_pk = EXCLUDED.tenant_pk, tenant_param = EXCLUDED.tenant_param, tenant_via_sql = EXCLUDED.tenant_via_sql, body_has_company = EXCLUDED.body_has_company, query_has_company = EXCLUDED.query_has_company, deprecated = EXCLUDED.deprecated;', '');
lines.push('-- Rollout switches start OFF: nothing is blocked or logged until a SuperAdmin changes them.');
lines.push("INSERT INTO entitlement_settings (setting_key, setting_value) VALUES ('mode', 'OFF'), ('tenant_mode', 'OFF') ON CONFLICT (setting_key) DO NOTHING;");
emit(path.join(BACKEND, 'migrations/entitlements_002_catalogue_seed.sql'), lines.join('\n') + '\n');

// ---- permission codes (59 = 57 + HOME_VIEW + REPORT_VIEW), assigned to NO role
const permRows = [];
const addPerm = (code, name, moduleName, description) => permRows.push({ code, name, moduleName, description });
const RIGHT_LABEL = { CREATE: 'Create', VIEW: 'View', EDIT: 'Edit', DELETE: 'Delete' };
[['DISTRICT', 'District', 'Master'], ['EQUIPMENT', 'Equipment', 'Master'], ['FINANCE_YEAR', 'Finance Year', 'Master'], ['PLACEHOLDER_MASTER', 'Placeholder Master', 'Master'], ['AGREEMENT_TEMPLATE', 'Agreement Template', 'Commercial']]
  .forEach(([p, n, mod]) => ['CREATE', 'VIEW', 'EDIT', 'DELETE'].forEach((r) => addPerm(`${p}_${r}`, `${RIGHT_LABEL[r]} ${n}`, mod, `${RIGHT_LABEL[r]} ${n} records`)));
addPerm('BARCODE_LABEL_UPDATE', 'Update Barcode Label', 'Transaction', 'Modify a generated barcode label record');
[['INCIDENT_REGISTER', 'Incident Register'], ['INCINERATION_REGISTER', 'Incineration Register'], ['AUTOCLAVE_REGISTER', 'Autoclave Register'], ['SHREDDER_REGISTER', 'Shredder Register'], ['DISPOSAL_REGISTER', 'Disposal Register'], ['EMISSION_REGISTER', 'Emission Register'], ['ETP_REGISTER', 'ETP Register'], ['DOWNTIME_REGISTER', 'Downtime Register'], ['COMPLIANCE_REGISTER', 'Compliance Register']]
  .forEach(([p, n]) => ['CREATE', 'VIEW', 'EDIT', 'DELETE'].forEach((r) => addPerm(`${p}_${r}`, `${RIGHT_LABEL[r]} ${n}`, p === 'COMPLIANCE_REGISTER' ? 'Compliance' : 'Transaction', `${RIGHT_LABEL[r]} ${n} records`)));
addPerm('HOME_VIEW', 'View Home (Mobile)', 'Mobile App', 'Mobile app: view the Home screen');
addPerm('REPORT_VIEW', 'View Analytics (Mobile)', 'Mobile App', 'Mobile app: view the Analytics screen');
const pl = [];
pl.push('-- Customer Entitlements - permission codes that controllers or routes already use but the permissions table lacks.');
pl.push('-- GENERATED by scripts/entitlements/build-seed.js.');
pl.push(`-- ${permRows.length} codes (57 + HOME_VIEW + REPORT_VIEW). Inserted ACTIVE and assigned to NO role: this file never touches roles or role_permissions.`);
pl.push('-- Idempotent: a code that already exists is left exactly as it is.');
pl.push('-- The runner verifies before/after that role_permissions is byte-identical.', '');
pl.push('INSERT INTO permissions ("permissionId", permission_code, permission_name, module_name, description, is_active)');
pl.push('SELECT gen_random_uuid(), v.code, v.name, v.module, v.description, TRUE FROM (VALUES');
pl.push(permRows.map((r) => `  (${q(r.code)}, ${q(r.name)}, ${q(r.moduleName)}, ${q(r.description)})`).join(',\n'));
pl.push(') AS v(code, name, module, description)');
pl.push('WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.permission_code = v.code);');
emit(path.join(BACKEND, 'migrations/entitlements_004_permission_codes.sql'), pl.join('\n') + '\n');

// ---- review CSVs
const docs = path.join(BACKEND, 'docs/entitlements');
if (!CHECK) fs.mkdirSync(docs, { recursive: true });
const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
emit(path.join(docs, 'endpoint-mapping-review.csv'), csv([
  ['method', 'route', 'controller', 'handler', 'permission_code', 'mapping_source', 'feature_codes_any_of', 'exempt_reason', 'tenant_mode', 'tenant_table', 'body_has_company', 'query_has_company'],
  ...mapped.map((e) => [e.method, e.path, e.controller, e.handler, e.perm, e.source, e.features ? e.features.join(' | ') : '', e.reason || '', e.tenant ? e.tenant.mode : '', e.tenant ? e.tenant.table || '' : '', e.bodyCompany ? 'Y' : '', e.queryCompany ? 'Y' : '']),
]));
emit(path.join(docs, 'catalogue-review.csv'), csv([
  ['level', 'code', 'name', 'parent', 'core', 'type', 'enforcement', 'permission_code', 'routes'],
  ...nodes.modules.map((m) => ['MODULE', m.code, m.name, '', m.core ? 'Y' : '', '', '', '', '']),
  ...nodes.submodules.map((s) => ['SUBMODULE', s.code, s.name, s.module, s.core ? 'Y' : '', '', '', '', s.routes.join(' ')]),
  ...nodes.features.map((f) => ['FEATURE', f.code, f.name, f.submodule, '', f.type, f.enforcement, f.perm || '', f.routes.join(' ')]),
]));

// ---- frontend route map
const routePairs = [];
Object.entries(moduleRoutes).forEach(([r, c]) => routePairs.push([r, c]));
nodes.submodules.forEach((s) => s.routes.forEach((r) => routePairs.push([r, s.code])));
nodes.features.forEach((f) => f.routes.forEach((r) => routePairs.push([r, f.code])));
routePairs.sort((a, b2) => b2[0].length - a[0].length || a[0].localeCompare(b2[0]));
const fe = process.argv.includes('--frontend') ? process.argv[process.argv.indexOf('--frontend') + 1] : null;
if (fe) {
  const out = [
    '// GENERATED by medi_waste_management_backend/scripts/entitlements/build-seed.js - do not edit by hand.',
    '// Frontend path prefix -> entitlement code (module, submodule or report feature). Longest prefix wins.',
    `export const ENTITLEMENT_RELEASE = '${RELEASE}';`,
    'export const ROUTE_ENTITLEMENTS: ReadonlyArray<readonly [string, string]> = [',
    ...routePairs.map(([r, c]) => `  ['${r}', '${c}'],`),
    '];',
    '',
    '// Code hierarchy used to decide which ancestors must also be enabled (child code -> parent code).',
    'export const ENTITLEMENT_PARENT: Readonly<Record<string, string>> = {',
    ...nodes.submodules.map((s) => `  '${s.code}': '${s.module}',`),
    ...nodes.features.map((f) => `  '${f.code}': '${f.submodule}',`),
    '};',
    '',
    '// Items that can never be switched off.',
    `export const CORE_MODULES: ReadonlyArray<string> = [${nodes.modules.filter((m) => m.core).map((m) => `'${m.code}'`).join(', ')}];`,
    '',
  ].join('\n');
  emit(path.join(path.resolve(fe), 'src/utils/routeEntitlements.generated.ts'), out);
}

if (CHECK) {
  if (stale.length) {
    console.error('Generated files are out of date. Run: node scripts/entitlements/build-seed.js --frontend <frontend path>\n  ' + stale.join('\n  '));
    process.exit(1);
  }
  console.log(`OK: ${mapped.length} endpoints mapped, generated files are up to date.`);
  process.exit(0);
}

const bySource = mapped.reduce((a, e) => ((a[e.source] = (a[e.source] || 0) + 1), a), {});
console.log(`Catalogue : ${nodes.modules.length} modules, ${nodes.submodules.length} submodules, ${nodes.features.length} features`);
console.log(`Endpoints : ${mapped.length} mapped ${JSON.stringify(bySource)}`);
console.log(`Tenant    : ${JSON.stringify(mapped.reduce((a, e) => { const m = e.tenant ? e.tenant.mode : 'none'; a[m] = (a[m] || 0) + 1; return a; }, {}))}`);
console.log(`Body companyId routes: ${mapped.filter((e) => e.bodyCompany).length}, query companyId routes: ${mapped.filter((e) => e.queryCompany).length}`);
console.log(`Permission codes to add: ${permRows.length}`);
console.log(`Frontend route map : ${fe ? 'written' : 'skipped (pass --frontend)'}`);
