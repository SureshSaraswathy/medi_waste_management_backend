// Navigation regression test: ONE shared sidebar, RBAC and customer entitlements combined.
// Real frontend build (FE_DIST) + stubbed API; entitlement data comes from the REAL catalogue captured from the database
// (fixtures/backend-shapes.json). Nothing is written anywhere.
// Run: FE_DIST=<vite build output> node test/entitlements/browser-navigation-test.js   (uses the backend's puppeteer)
const path = require('path'), fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../..') + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST;
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/backend-shapes.json'), 'utf8'));
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

const nodes = []; const walk = (n, top) => { nodes.push({ code: n.code, type: n.type, top, core: n.core }); (n.submodules || n.features || []).forEach((c) => walk(c, top)); };
FX.tree.modules.forEach((m) => walk(m, m.code));
const meFor = (mode, off, isSuper) => { const on = nodes.filter((n) => !off.includes(n.top) || n.core); return { mode, tenantMode: 'OFF', version: 'v:' + off.join('+'), isSuperAdmin: !!isSuper, modules: on.filter((n) => n.type === 'MODULE').map((n) => n.code), submodules: on.filter((n) => n.type === 'SUBMODULE').map((n) => n.code), features: on.filter((n) => n.type === 'FEATURE').map((n) => n.code) }; };

const ALL_MENU = ['MENU_TRANSACTION_VIEW', 'MENU_FINANCE_VIEW', 'MENU_COMMERCIAL_VIEW', 'MENU_COMPLIANCE_VIEW', 'MENU_MASTER_VIEW', 'MENU_REPORTS_VIEW', 'REPORTS_VIEW'];
const PROFILES = {
  superAdmin: { perms: ['*'], isSuper: true },
  customerAdmin: { perms: ['DASHBOARD_VIEW', ...ALL_MENU, 'USER_VIEW', 'ROLE_VIEW', 'COMPANY_VIEW'], isSuper: false },
  reportsOnly: { perms: ['MENU_REPORTS_VIEW', 'REPORTS_VIEW'], isSuper: false },
  reportsPlusUsers: { perms: ['MENU_REPORTS_VIEW', 'REPORTS_VIEW', 'USER_VIEW'], isSuper: false },
  reportsPlusRoles: { perms: ['MENU_REPORTS_VIEW', 'REPORTS_VIEW', 'ROLE_VIEW'], isSuper: false },
  transactionUser: { perms: ['MENU_TRANSACTION_VIEW'], isSuper: false },
  masterUser: { perms: ['MENU_MASTER_VIEW', 'USER_VIEW', 'ROLE_VIEW'], isSuper: false },
  masterUserNoMenu: { perms: ['COMPANY_VIEW', 'USER_VIEW', 'ROLE_VIEW', 'STATE_VIEW'], isSuper: false }, // many master-ish view codes, but NOT the Master menu permission
};
const TOOLS = ['Dashboard Configuration', 'Permission Configuration', 'Customer Entitlements'];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const open = async (profile, mode, off, live) => {
    const state = { off };
    const prof = PROFILES[profile]; const ctx = await browser.createBrowserContext(); const page = await ctx.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument((u) => localStorage.setItem('mw-auth-user', JSON.stringify(u)), { id: 'u1', name: 'T', email: 't@t.t', roles: ['admin'], token: 'aaa.bbb.ccc', companyId: prof.isSuper ? '00000000-0000-0000-0000-000000000000' : FX.companies[0].companyId });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (u.port === '3000') {
        const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
        const p = u.pathname; let body;
        if (p.endsWith('/entitlements/me')) body = { success: true, data: meFor(mode, state.off, prof.isSuper) };
        else if (p.endsWith('/auth/permissions')) body = { success: true, data: { userId: 'u1', permissions: prof.perms, isSuperAdmin: prof.isSuper } };
        else if (p.endsWith('/admin/entitlements/mode')) body = { success: true, data: FX.mode };
        else if (p.endsWith('/admin/entitlements/companies')) body = { success: true, data: FX.companies };
        else if (/\/dashboard/.test(p)) body = { success: true, data: { kpis: [], widgets: [], charts: [], tables: [], layout: [], widgetCatalog: [], config: {}, items: [] }, message: '' };
        else if (p.endsWith('/notifications/my')) body = []; else if (p.endsWith('/unread-count')) body = { count: 0 };
        else body = { success: true, data: [], message: '' };
        return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
      }
      if (u.hostname === 'app.local') { let f = path.join(DIST, decodeURIComponent(u.pathname)); if (u.pathname === '/' || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html'); return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); }
      req.respond({ status: 204, body: '' });
    });
    await page.goto('http://app.local/dashboard', { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {}); await sleep(900);
    return { page, ctx, state };
  };
  const visitOnce = async (page, route) => {
    await page.evaluate((x) => { history.pushState({}, '', x); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
    for (let i = 0; i < 12; i++) { await sleep(250); const done = await page.evaluate(() => document.querySelectorAll('.nav-link, .nav-item').length > 0 || /Not authorized/i.test(document.body.innerText)); if (done) break; }
    await sleep(250);
    return page.evaluate(() => { const t = document.body.innerText; return { url: location.pathname, nav: [...document.querySelectorAll('.nav-link, .nav-item')].map((a) => a.innerText.trim()).filter(Boolean), outcome: /Feature not available/.test(t) ? 'NOT-LICENSED' : /Not authorized/i.test(t) ? 'NOT-AUTHORIZED' : 'page' }; });
  };
  // a page that redirects while we read it (e.g. to Not Authorized) can detach the frame under us: retry the same visit
  const visit = async (page, route) => { for (let a = 0; a < 3; a++) { try { return await visitOnce(page, route); } catch (e) { if (!/detached|Execution context|Target closed/i.test(String(e && e.message)) || a === 2) throw e; await sleep(800); } } };
  const has = (r, l) => r.nav.includes(l);

  console.log('[1] SuperAdmin, all modules enabled (ENFORCE): the same full sidebar on every page type');
  { const { page, ctx } = await open('superAdmin', 'ENFORCE', []);
    const EXPECT = ['Dashboard', 'Transaction', 'Finance', 'Commercial / Agreements', 'Compliance & Training', 'Master', 'Reports', ...TOOLS];
    for (const r of ['/dashboard', '/transaction', '/master', '/report', '/report/invoice', '/master/user-management', '/admin/permission-configuration', '/admin/customer-entitlements']) {
      const v = await visit(page, r);
      ok(v.outcome === 'page' && EXPECT.every((l) => has(v, l)) && !has(v, 'Masters'), `${r}: opens, sidebar has all modules + the 3 SuperAdmin tools, label "Master" (never "Masters")`, JSON.stringify(v.nav));
    }
    await ctx.close(); }
  console.log('[1b] SuperAdmin stays unrestricted even with modules disabled for the customer');
  { const { page, ctx } = await open('superAdmin', 'ENFORCE', ['MASTER', 'REPORTS', 'TRANSACTION']);
    for (const r of ['/master', '/report', '/transaction']) { const v = await visit(page, r); ok(v.outcome === 'page', `${r} opens for SuperAdmin`, v.outcome); }
    const v = await visit(page, '/report'); ok(has(v, 'Master') && has(v, 'Reports') && has(v, 'Transaction'), 'SuperAdmin sidebar still lists the disabled modules', JSON.stringify(v.nav));
    await ctx.close(); }

  console.log('[2] Customer user with Master ENABLED');
  { const { page, ctx } = await open('masterUser', 'ENFORCE', []);
    for (const r of ['/dashboard', '/report', '/transaction', '/master', '/master/user-management']) { const v = await visit(page, r); ok(has(v, 'Master') && !has(v, 'Administration') && !has(v, 'Masters'), `${r}: Master item shown, no duplicate Administration entry`, JSON.stringify(v.nav)); }
    const v = await visit(page, '/master'); ok(v.outcome === 'page', '/master opens'); await ctx.close(); }

  console.log('[3] Customer user with Master DISABLED (ENFORCE) - core Administration stays available');
  for (const profile of ['customerAdmin', 'masterUser', 'reportsPlusUsers']) {
    const { page, ctx } = await open(profile, 'ENFORCE', ['MASTER']);
    const hub = await visit(page, '/master');
    ok(hub.outcome === 'NOT-LICENSED', `${profile}: /master is blocked ("Feature not available")`, hub.outcome);
    ok(hub.nav.length > 0 && has(hub, 'Dashboard'), `${profile}: the blocked page still shows the sidebar (no dead end)`, JSON.stringify(hub.nav));
    for (const r of ['/dashboard', '/report', '/transaction', '/master/user-management']) { const v = await visit(page, r); ok(!has(v, 'Master') && !has(v, 'Masters') && has(v, 'Administration'), `${profile} ${r}: Master hidden, Administration entry shown`, JSON.stringify(v.nav)); }
    const um = await visit(page, '/master/user-management'); ok(um.outcome === 'page', `${profile}: /master/user-management still opens (core Administration)`, um.outcome);
    await ctx.close(); }
  { const { page, ctx } = await open('reportsPlusRoles', 'ENFORCE', ['MASTER']);
    const rp = await visit(page, '/master/roles-permissions'); ok(rp.outcome === 'page' && has(rp, 'Administration'), 'roles-only user: /master/roles-permissions opens; Administration entry points there', rp.outcome + JSON.stringify(rp.nav));
    const adm = await page.evaluate(() => (document.querySelector('a[href="/master/roles-permissions"].nav-link, a[href="/master/roles-permissions"].nav-item') || {}).innerText || null); ok(adm === 'Administration', 'the Administration entry links to /master/roles-permissions for a roles-only user', String(adm));
    await ctx.close(); }
  { const { page, ctx } = await open('customerAdmin', 'ENFORCE', ['MASTER']);
    const v = await visit(page, '/master/company'); ok(v.outcome === 'NOT-LICENSED', 'a Master page (/master/company) is blocked when Master is disabled', v.outcome);
    await ctx.close(); }

  console.log('[4] Customer user with Reports DISABLED - no dead end');
  for (const profile of ['customerAdmin', 'reportsOnly', 'reportsPlusUsers']) {
    const { page, ctx } = await open(profile, 'ENFORCE', ['REPORTS']);
    for (const r of ['/report', '/report/invoice']) { const v = await visit(page, r); ok(v.outcome === 'NOT-LICENSED' && v.nav.length > 0 && has(v, 'Dashboard') && !has(v, 'Reports'), `${profile} ${r}: "Feature not available" inside the app layout, sidebar present without Reports`, v.outcome + JSON.stringify(v.nav)); }
    const d = await visit(page, '/dashboard'); ok(!has(d, 'Reports'), `${profile}: Reports hidden everywhere`, JSON.stringify(d.nav));
    await ctx.close(); }

  console.log('[5] Dashboard (core) is always available');
  for (const [profile, off] of [['reportsOnly', ['REPORTS', 'MASTER', 'TRANSACTION']], ['customerAdmin', ['REPORTS', 'MASTER', 'TRANSACTION', 'FINANCE']]]) {
    const { page, ctx } = await open(profile, 'ENFORCE', off); const v = await visit(page, '/dashboard');
    ok(v.outcome === 'page' && has(v, 'Dashboard'), `${profile}: /dashboard opens and Dashboard is listed with several modules disabled`, v.outcome); await ctx.close(); }

  console.log('[6] Transaction enabled / disabled');
  { const { page, ctx } = await open('transactionUser', 'ENFORCE', []); const v = await visit(page, '/transaction'); ok(v.outcome === 'page' && has(v, 'Transaction'), 'Transaction enabled: item shown, /transaction opens', JSON.stringify(v.nav)); await ctx.close(); }
  { const { page, ctx } = await open('transactionUser', 'ENFORCE', ['TRANSACTION']); const v = await visit(page, '/transaction'); const d = await visit(page, '/dashboard');
    ok(v.outcome === 'NOT-LICENSED' && !has(d, 'Transaction'), 'Transaction disabled: item hidden, /transaction blocked', v.outcome + JSON.stringify(d.nav)); await ctx.close(); }

  console.log('[7] Existing RBAC restrictions are preserved (entitlements never grant access)');
  { const { page, ctx } = await open('masterUserNoMenu', 'OFF', []);
    const d = await visit(page, '/dashboard');
    ok(!has(d, 'Master'), 'unrelated view permissions (COMPANY_VIEW, USER_VIEW, ROLE_VIEW, STATE_VIEW) do NOT make Master appear', JSON.stringify(d.nav));
    ok(has(d, 'Administration'), '... they lead to the Administration entry (they can manage users/roles)', JSON.stringify(d.nav));
    const hub = await visit(page, '/master'); ok(hub.outcome === 'NOT-AUTHORIZED', '/master is still refused by RBAC (no Master menu permission)', hub.outcome);
    for (const r of ['/admin/dashboard-configuration', '/admin/permission-configuration', '/admin/customer-entitlements']) { const v = await visit(page, r); ok(v.outcome === 'NOT-AUTHORIZED', `${r}: not authorized for a customer user`, v.outcome); }
    for (const l of TOOLS) ok(!has(d, l), `sidebar does not list "${l}" for a customer user`);
    await ctx.close(); }
  { const { page, ctx } = await open('reportsOnly', 'ENFORCE', []);
    const t = await visit(page, '/transaction'); const u = await visit(page, '/master/user-management'); const r = await visit(page, '/report');
    ok(t.outcome === 'NOT-AUTHORIZED' && u.outcome === 'NOT-AUTHORIZED' && r.outcome === 'page', 'reports-only user: Transaction and User Management refused, Reports open (RBAC unchanged by entitlements)', JSON.stringify([t.outcome, u.outcome, r.outcome]));
    const rv = await visit(page, '/report'); ok(JSON.stringify(rv.nav) === JSON.stringify(['Dashboard', 'Reports']), 'reports-only sidebar = Dashboard, Reports (no Master, no Administration)', JSON.stringify(rv.nav));
    await ctx.close(); }
  { const { page, ctx } = await open('customerAdmin', 'OFF', ['MASTER', 'REPORTS']);
    const v = await visit(page, '/report'); ok(v.outcome === 'page' && has(v, 'Reports') && has(v, 'Master'), 'licensing mode OFF: nothing is hidden even if modules are marked disabled', JSON.stringify(v.nav)); await ctx.close(); }

  console.log('[9] Every module x {enabled, disabled} x {SuperAdmin, customer admin, hub-permission user, narrow-permission user}: sidebar and direct route checked independently');
  const MODS = [
    { key: 'transaction', route: '/transaction', label: 'Transaction', code: 'TRANSACTION', hub: ['MENU_TRANSACTION_VIEW'], narrow: ['ROUTE_ASSIGNMENT_VIEW', 'WASTE_COLLECTION_VIEW', 'BARCODE_LABEL_VIEW'] },
    { key: 'finance', route: '/finance', label: 'Finance', code: 'FINANCE', hub: ['MENU_FINANCE_VIEW'], narrow: ['INVOICE_VIEW'] },
    { key: 'commercial', route: '/commercial-agreements', label: 'Commercial / Agreements', code: 'COMMERCIAL', hub: ['MENU_COMMERCIAL_VIEW'], narrow: ['CONTRACT_VIEW', 'AGREEMENT_VIEW', 'AGREEMENT_CLAUSE_VIEW'] },
    { key: 'compliance', route: '/compliance-training', label: 'Compliance & Training', code: 'COMPLIANCE', hub: ['MENU_COMPLIANCE_VIEW'], narrow: ['TRAINING_CERTIFICATE_VIEW'] },
    { key: 'master', route: '/master', label: 'Master', code: 'MASTER', hub: ['MENU_MASTER_VIEW'], narrow: ['COMPANY_VIEW', 'USER_VIEW', 'ROLE_VIEW', 'STATE_VIEW', 'HCF_VIEW'] },
    { key: 'report', route: '/report', label: 'Reports', code: 'REPORTS', hub: ['MENU_REPORTS_VIEW'], narrow: ['EXPORT_VIEW', 'REPORT_VIEW'] },
  ];
  const addProfile = (name, perms, isSuper) => { PROFILES[name] = { perms, isSuper }; };
  let invariantBroken = 0, combos = 0;
  for (const m of MODS) {
    addProfile('hub_' + m.key, m.hub, false); addProfile('narrow_' + m.key, m.narrow, false);
    for (const who of ['superAdmin', 'customerAdmin', 'hub_' + m.key, 'narrow_' + m.key]) {
      for (const enabled of [true, false]) {
        const { page, ctx } = await open(who, 'ENFORCE', enabled ? [] : [m.code]);
        const prof = PROFILES[who];
        const rbacOk = prof.isSuper || prof.perms.some((p) => MODS.find((x) => x.key === m.key).hub.includes(p) || (m.key === 'finance' && p === 'FINANCE_VIEW') || (m.key === 'report' && p === 'REPORTS_VIEW'));
        const side = await visit(page, '/dashboard');          // sidebar judged on a neutral page
        const route = await visit(page, m.route);              // direct route judged separately
        const wantLink = prof.isSuper ? true : (rbacOk && enabled);
        const wantRoute = prof.isSuper ? 'page' : (!enabled ? 'NOT-LICENSED' : (rbacOk ? 'page' : 'NOT-AUTHORIZED'));
        combos += 1;
        const tag = (who.startsWith('hub_') ? 'hub-permission user' : who.startsWith('narrow_') ? 'narrow-permission user' : who) + ', ' + m.label + (enabled ? ' enabled' : ' DISABLED');
        ok(has(side, m.label) === wantLink, 'sidebar: ' + tag + ' -> link ' + (wantLink ? 'shown' : 'hidden'), JSON.stringify(side.nav));
        ok(route.outcome === wantRoute, 'route:   ' + tag + ' -> ' + wantRoute, route.outcome);
        if (has(side, m.label) && route.outcome !== 'page') { invariantBroken += 1; console.log('   !! link shown but route ' + route.outcome + ' (' + tag + ')'); }
        await ctx.close();
      }
    }
  }
  ok(invariantBroken === 0, 'INVARIANT over ' + combos + ' combinations: a module link is never shown when its hub route would refuse the user');

  console.log('[10] Sidebar follows entitlement changes WITHOUT navigation, reload or login (existing context refresh: window focus / 60 s / licensing refusal)');
  { const { page, ctx, state } = await open('customerAdmin', 'ENFORCE', [], true);
    const refresh = async () => { await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await sleep(1100); };
    for (const park of ['/dashboard', '/master/user-management', '/report', '/transaction', '/profile', '/finance']) {
      state.off = []; await visit(page, park); await refresh();
      let n = await page.evaluate(() => [...document.querySelectorAll('.nav-link, .nav-item')].map((a) => a.innerText.trim()).filter(Boolean));
      const startedWithAll = n.includes('Transaction') && n.includes('Finance') && n.includes('Master');
      state.off = ['TRANSACTION', 'MASTER']; await refresh();
      n = await page.evaluate(() => [...document.querySelectorAll('.nav-link, .nav-item')].map((a) => a.innerText.trim()).filter(Boolean));
      const hidden = !n.includes('Transaction') && !n.includes('Master');
      state.off = []; await refresh();
      n = await page.evaluate(() => [...document.querySelectorAll('.nav-link, .nav-item')].map((a) => a.innerText.trim()).filter(Boolean));
      const restored = n.includes('Transaction') && n.includes('Master');
      ok(startedWithAll && hidden && restored, park + ': disabled modules disappear and come back in place, no navigation / reload', JSON.stringify({ startedWithAll, hidden, restored, nav: n }));
    }
    state.off = ['REPORTS']; await visit(page, '/report'); await refresh();
    const body = await page.evaluate(() => document.body.innerText); ok(/Feature not available/.test(body), 'parked on /report when Reports is disabled: the page itself switches to "Feature not available" (with sidebar)');
    state.off = []; await refresh(); const back = await page.evaluate(() => /Feature not available/.test(document.body.innerText)); ok(!back, 'and the report page comes back when Reports is enabled again');
    await ctx.close(); }

  console.log('[11] Narrow-permission users: individual pages open by direct URL only with their own permission; the hub link stays hidden; nothing else opens');
  const NARROW = [
    { perm: 'INVOICE_VIEW', opens: ['/finance/invoice-management', '/finance/payment'], refused: ['/commercial-agreements/contract-master', '/transaction/route-assignment', '/master/company'], hubs: ['/finance', '/commercial-agreements'], hidden: ['Finance', 'Commercial / Agreements'] },
    { perm: 'CONTRACT_VIEW', opens: ['/commercial-agreements/contract-master'], refused: ['/finance/invoice-management', '/master/company'], hubs: ['/commercial-agreements'], hidden: ['Commercial / Agreements'] },
    { perm: 'ROUTE_ASSIGNMENT_VIEW', opens: ['/transaction/route-assignment'], refused: ['/transaction/waste-collection', '/finance/invoice-management'], hubs: ['/transaction'], hidden: ['Transaction'] },
    { perm: 'WASTE_COLLECTION_VIEW', opens: ['/transaction/waste-collection'], refused: ['/transaction/route-assignment'], hubs: ['/transaction'], hidden: ['Transaction'] },
    { perm: 'COMPANY_VIEW', opens: ['/master/company'], refused: ['/master/user-management', '/finance/invoice-management'], hubs: ['/master'], hidden: ['Master'] },
    { perm: 'USER_VIEW', opens: ['/master/user-management'], refused: ['/master/company'], hubs: ['/master'], hidden: ['Master'] },
  ];
  for (const n of NARROW) {
    PROFILES['only_' + n.perm] = { perms: [n.perm], isSuper: false };
    const { page, ctx } = await open('only_' + n.perm, 'ENFORCE', []);
    const side = await visit(page, '/dashboard');
    ok(n.hidden.every((l) => !has(side, l)), `${n.perm}: module link(s) hidden (${n.hidden.join(', ')})`, JSON.stringify(side.nav));
    for (const r of n.hubs) { const v = await visit(page, r); ok(v.outcome === 'NOT-AUTHORIZED', `${n.perm}: hub ${r} refused`, v.outcome); }
    for (const r of n.opens) { const v = await visit(page, r); ok(v.outcome === 'page', `${n.perm}: direct URL ${r} opens`, v.outcome); }
    for (const r of n.refused) { const v = await visit(page, r); ok(v.outcome === 'NOT-AUTHORIZED', `${n.perm}: ${r} stays refused`, v.outcome); }
    await ctx.close();
  }
  { const { page, ctx } = await open('only_INVOICE_VIEW', 'ENFORCE', ['FINANCE']);   // entitlement still restricts a narrow-permission user
    const v = await visit(page, '/finance/invoice-management'); ok(v.outcome === 'NOT-LICENSED', 'INVOICE_VIEW + Finance disabled: the invoice page is blocked by the entitlement', v.outcome); await ctx.close(); }

  console.log('[8] One shared sidebar: no page keeps its own static navigation list');
  const pagesDir = path.resolve(__dirname, '../../../medi_waste_management_frontend/frontend/src/pages');
  if (fs.existsSync(pagesDir)) {
    const files = []; const w = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); e.isDirectory() ? w(f) : /\.tsx$/.test(e.name) && files.push(f); }); w(pagesDir);
    const own = files.filter((f) => /const navItems(All)?\s*(:[^=]+)?=\s*\[/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(pagesDir, f).replace(/\\\\/g, '/'));
    const masters = files.filter((f) => /label:\s*'Masters'/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(pagesDir, f).replace(/\\\\/g, '/'));
    console.log('   pages that still declare their own list:', JSON.stringify(own));
    ok(!own.some((f) => /ReportPage|reports\/|DashboardPage|TransactionPage|MasterPage|DashboardConfigurationPage|PermissionConfigurationPage|UserManagementPage|RolesPermissionsPage|GenerateInvoices|DraftInvoice/.test(f)), 'the Dashboard, Transaction, Master, Report, Administration and configuration pages use the shared sidebar', JSON.stringify(own));
    ok(masters.length === 0, 'no page labels the Master item "Masters"', JSON.stringify(masters));
  } else console.log('   (frontend sources not found next to the backend: static-list scan skipped)');

  await browser.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
