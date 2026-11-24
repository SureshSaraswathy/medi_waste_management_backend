// Behaviour of GET /auth/menu-config (used by the mobile menus as a fallback): the module-level `visible` flags follow the SAME rules as the
// web sidebar / hub routes, and the response shape (module keys, `permission`, master `submenus`) is unchanged.
// Plain Node over the compiled build: DIST=<compiled backend dist> node test/entitlements/test-menu-config.js
const path = require('path');
const DIST = process.env.DIST || path.resolve(__dirname, '../../dist');
require('reflect-metadata');
const { AuthController } = require(DIST + '/modules/auth/presentation/auth.controller');
let pass = 0, fail = 0; const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

const call = async (perms) => {
  const c = Object.create(AuthController.prototype);
  c.permissionService = { loadUserPermissions: async () => perms };
  return (await c.getMenuConfig({ user: { userId: 'u', userRoleId: 'r', email: 'e', userName: 'n' } })).data;
};
const vis = (d) => ({ dashboard: d.dashboard.visible, transaction: d.transaction.visible, finance: d.finance.visible, commercial: d.commercialAgreements.visible, compliance: d.complianceTraining.visible, master: d.master.visible, report: d.report.visible });

(async () => {
  console.log('[1] hub permissions open exactly their module');
  const cases = [
    ['MENU_TRANSACTION_VIEW', 'transaction'], ['MENU_FINANCE_VIEW', 'finance'], ['FINANCE_VIEW', 'finance'], ['MENU_COMMERCIAL_VIEW', 'commercial'],
    ['MENU_COMPLIANCE_VIEW', 'compliance'], ['MENU_MASTER_VIEW', 'master'], ['MASTERS_VIEW', 'master'], ['MENU_REPORTS_VIEW', 'report'], ['REPORTS_VIEW', 'report'],
  ];
  for (const [perm, mod] of cases) { const v = vis(await call([perm])); ok(v[mod] === true && Object.entries(v).filter(([k, x]) => x && k !== 'dashboard').length === 1, `${perm} -> only "${mod}" is visible`, JSON.stringify(v)); }
  console.log('[2] narrow page permissions do NOT open a module');
  for (const [perm, mod] of [['INVOICE_VIEW', 'finance'], ['CONTRACT_VIEW', 'commercial'], ['AGREEMENT_VIEW', 'commercial'], ['TRAINING_CERTIFICATE_VIEW', 'compliance'], ['ROUTE_ASSIGNMENT_VIEW', 'transaction'], ['WASTE_COLLECTION_VIEW', 'transaction'], ['USER_VIEW', 'master'], ['ROLE_VIEW', 'master'], ['COMPANY_VIEW', 'master'], ['HCF_VIEW', 'master']]) {
    const v = vis(await call([perm])); ok(v[mod] === false, `${perm} does not make "${mod}" visible`, JSON.stringify(v));
  }
  console.log('[3] SuperAdmin and the always-visible dashboard');
  const sa = vis(await call(['*'])); ok(Object.values(sa).every(Boolean), 'wildcard: everything visible', JSON.stringify(sa));
  const none = vis(await call([])); ok(none.dashboard === true && Object.entries(none).filter(([k, x]) => k !== 'dashboard' && x).length === 0, 'no permissions: only the dashboard shell', JSON.stringify(none));
  console.log('[4] response shape unchanged (submenus and permission hints)');
  const d = await call(['COMPANY_VIEW', 'HCF_VIEW']);
  ok(JSON.stringify(Object.keys(d)) === JSON.stringify(['dashboard', 'transaction', 'finance', 'commercialAgreements', 'complianceTraining', 'master', 'report']), 'same module keys in the same order', JSON.stringify(Object.keys(d)));
  ok(d.master.permission === 'MENU_MASTER_VIEW' && d.transaction.permission === 'MENU_TRANSACTION_VIEW' && d.report.permission === 'MENU_REPORTS_VIEW', 'same `permission` hints');
  ok(d.master.submenus && d.master.submenus.company.visible === true && d.master.submenus.hcf.visible === true && d.master.submenus.state.visible === false && Object.keys(d.master.submenus).length === 12, 'master submenus keep their own per-permission flags (12 entries)', JSON.stringify(Object.keys(d.master.submenus || {})));
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
