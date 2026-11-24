// Contract test: the frontend's TypeScript types for the Customer Entitlements API must describe EXACTLY the shapes the
// backend really returns (fixtures/backend-shapes.json = real captured responses), and the page must not read any
// snake_case property. Pure file/JSON checks, no server and no browser needed.
// Env: FE_SRC (frontend/src folder).
const fs = require('fs'), path = require('path');
const FE = process.env.FE_SRC;
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/backend-shapes.json'), 'utf8'));
let pass = 0, fail = 0; const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const svc = fs.readFileSync(path.join(FE, 'services/entitlementService.ts'), 'utf8').replace(/\r\n/g, '\n');
const page = fs.readFileSync(path.join(FE, 'pages/desktop/admin/CustomerEntitlementsPage.tsx'), 'utf8');
const iface = (name) => { const m = new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`).exec(svc); if (!m) return null; return m[1].split('\n').map((l) => /^\s*([A-Za-z_]+)\??:/.exec(l)).filter(Boolean).map((x) => x[1]).sort(); };
const keys = (o) => Object.keys(o).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('[1] interface keys == real response keys');
const company = FX.companies[0];
ok(same(iface('CompanySummary'), keys(company)), 'CompanySummary == GET /companies item', JSON.stringify([iface('CompanySummary'), keys(company)]));
ok(same(keys(FX.tree.company), ['companyCode', 'companyId', 'companyName']) && /company: \{ companyId: string; companyCode: string; companyName: string \}/.test(svc), 'CompanyTree.company == real tree.company (companyId, companyCode, companyName)');
ok(same(iface('CompanyTree'), keys(FX.tree).filter((k) => ['company', 'version', 'modes', 'totals', 'modules'].includes(k))) && same(keys(FX.tree), ['company', 'modes', 'modules', 'totals', 'version']), 'CompanyTree top level == real tree', JSON.stringify([iface('CompanyTree'), keys(FX.tree)]));
ok(same(iface('AuditRow'), keys(FX.audit.rows[0])), 'AuditRow == GET /audit row', JSON.stringify([iface('AuditRow'), keys(FX.audit.rows[0])]));
const nodeKeys = iface('EntitlementNode'); const realNode = FX.tree.modules[0];
ok(nodeKeys.every((k) => k in realNode || ['submodules', 'features'].includes(k)), 'EntitlementNode fields all exist on the real node', JSON.stringify(nodeKeys.filter((k) => !(k in realNode))));
ok(same(Object.keys(FX.tree.totals).sort(), ['effective', 'items', 'newItems']) && same(Object.keys(FX.mode).sort(), ['mode', 'tenantMode']), 'totals and mode keys match what the page types declare');

console.log('\n[2] real responses are camelCase everywhere the frontend reads them');
const snake = (o) => { const bad = []; const walk = (v, p) => { if (Array.isArray(v)) v.slice(0, 3).forEach((x) => walk(x, p)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (/_/.test(k)) bad.push(p + k); walk(x, p + k + '.'); } }; walk(o, ''); return bad; };
ok(snake({ c: FX.companies, t: { ...FX.tree, modules: FX.tree.modules.slice(0, 2) }, a: FX.audit, m: FX.mode }).length === 0, 'no snake_case keys in companies / tree / audit / mode responses', JSON.stringify(snake({ c: FX.companies, t: FX.tree, a: FX.audit })));

console.log('\n[3] the page reads only existing properties');
const SNAKE_IN_PAGE = /\b(company_id|company_name|company_code|enabled_modules|total_modules|new_items|audit_id|batch_id|entity_code|old_value|new_value|changed_by_name|changed_by|changed_on)\b/;
ok(!SNAKE_IN_PAGE.test(page), 'CustomerEntitlementsPage.tsx has no snake_case field access', (SNAKE_IN_PAGE.exec(page) || [])[0]);
ok(!/\[k: string\]: unknown/.test(svc.slice(svc.indexOf('export interface CompanySummary'), svc.indexOf('export class EntitlementApiError'))), 'the three response interfaces have no catch-all index signature (a wrong property name is a compile error)');
for (const f of ['companyId', 'companyName', 'companyCode']) ok(page.includes(f), `page uses ${f}`);
console.log('\n[4] one permission rule per module hub: sidebar = hub route guard = backend /auth/menu-config');
{
  const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  const perms = read(path.join(FE, 'utils/modulePermissions.ts'));
  const hubList = (key) => { const m = new RegExp('\\n  ' + key + ': \\[([^\\]]*)\\]').exec(perms); return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort() : null; };
  const KEYS = { transaction: 'transaction', finance: 'finance', commercialAgreements: 'commercial', complianceTraining: 'compliance', master: 'master', report: 'report' };
  const be = read(path.resolve(__dirname, '../../src/modules/auth/presentation/auth.controller.ts'));
  const beList = (key) => { const m = new RegExp('\\n        ' + key + ': \\{\\s*visible: hasAny\\(\\[([^\\]]*)\\]\\)').exec(be); return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort() : null; };
  for (const [beKey, feKey] of Object.entries(KEYS)) {
    const a = hubList(feKey), b = beList(beKey);
    ok(a && b && JSON.stringify(a) === JSON.stringify(b), 'backend menu-config "' + beKey + '".visible == frontend hub permissions "' + feKey + '"', JSON.stringify({ frontend: a, backend: b }));
  }
  const app = read(path.join(FE, 'App.tsx'));
  for (const [route, key] of [['/transaction', 'transaction'], ['/finance', 'finance'], ['/commercial-agreements', 'commercial'], ['/compliance-training', 'compliance'], ['/master', 'master'], ['/report', 'report']]) {
    const i = app.indexOf('path="' + route + '"'); const seg = app.slice(i, i + 700);
    ok(i > 0 && seg.includes('anyOf={MODULE_HUB_PERMISSIONS.' + key + '}'), 'hub route ' + route + ' is guarded by the shared MODULE_HUB_PERMISSIONS.' + key + ' list', seg.slice(0, 200).replace(/\s+/g, ' '));
  }
  const acc = read(path.join(FE, 'utils/moduleAccess.ts'));
  ok(/MODULE_MENU_PERMISSIONS[^=]*=\s*MODULE_HUB_PERMISSIONS;/.test(acc), 'sidebar visibility (moduleAccess.ts) reads the same MODULE_HUB_PERMISSIONS, with no separate list');
  const hubOnly = ['INVOICE_VIEW', 'CONTRACT_VIEW', 'AGREEMENT_VIEW', 'TRAINING_CERTIFICATE_VIEW', 'ROUTE_ASSIGNMENT_VIEW', 'WASTE_COLLECTION_VIEW', 'USER_VIEW', 'COMPANY_VIEW', 'ROLE_VIEW'];
  const all = Object.keys(KEYS).flatMap((k) => hubList(KEYS[k]));
  ok(hubOnly.every((p) => !all.includes(p)), 'narrow page permissions (INVOICE_VIEW, CONTRACT_VIEW, USER_VIEW, ...) are not in any hub list', JSON.stringify(hubOnly.filter((p) => all.includes(p))));
}
console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
