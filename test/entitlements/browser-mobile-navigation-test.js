// Mobile navigation (bottom bar + side drawer): RBAC, customer entitlements, refresh, empty permission lists, and agreement with the
// backend /auth/menu-config. Real frontend build (FE_DIST) + stubbed API; the menu-config answers come from the REAL compiled backend
// controller (BE_DIST, default ../../dist). Nothing is written anywhere.
// Run: FE_DIST=<vite build output> [BE_DIST=<compiled backend>] node test/entitlements/browser-mobile-navigation-test.js
const path = require('path'), fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../..') + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST;
const BE_DIST = process.env.BE_DIST || path.resolve(__dirname, '../../dist');
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/backend-shapes.json'), 'utf8'));
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

const nodes = []; const walk = (n, top) => { nodes.push({ code: n.code, type: n.type, top, core: n.core }); (n.submodules || n.features || []).forEach((c) => walk(c, top)); };
FX.tree.modules.forEach((m) => walk(m, m.code));
const meFor = (off, isSuper) => { const on = nodes.filter((n) => !off.some((o) => n.code === o || n.code.startsWith(o + '.')) || n.core); return { mode: 'ENFORCE', tenantMode: 'OFF', version: 'v:' + off.join('+'), isSuperAdmin: !!isSuper, modules: on.filter((n) => n.type === 'MODULE').map((n) => n.code), submodules: on.filter((n) => n.type === 'SUBMODULE').map((n) => n.code), features: on.filter((n) => n.type === 'FEATURE').map((n) => n.code) }; };

// mobile entries (label, route, permission that opens the route) as defined by the drawer and the route guards in App.tsx
const ENTRIES = [
  { label: 'Home', route: '/mobile/home', perm: 'HOME_VIEW', code: 'MOBILE_APP.HOME' },
  { label: 'Waste Entry', route: '/mobile/waste-entry', perm: 'WASTE_COLLECTION_CREATE', code: 'MOBILE_APP.WASTE_ENTRY' },
  { label: 'Waste Collections', route: '/mobile/waste-collections', perm: 'WASTE_COLLECTION_VIEW', code: 'MOBILE_APP.WASTE_COLLECTIONS' },
  { label: 'Route Assignment', route: '/mobile/assign-hospital', perm: 'ROUTE_ASSIGNMENT_VIEW', code: 'MOBILE_APP.ASSIGN_HOSPITAL' },
  { label: 'Assigned HCF List', route: '/mobile/assigned-hcfs', perm: 'ROUTE_HCF_VIEW', code: 'MOBILE_APP.ASSIGNED_HCFS' },
  { label: 'Scan Barcode', route: '/mobile/scan', perm: 'WASTE_COLLECTION_CREATE', code: 'MOBILE_APP.SCAN' },
  { label: 'HCF Master', route: '/mobile/hcf-master', perm: 'HCF_VIEW', code: 'MOBILE_APP.HCF_MASTER' },
  { label: 'Analytics', route: '/mobile/analytics', perm: 'REPORT_VIEW', code: 'MOBILE_APP.ANALYTICS' },
];
const PROFILES = {
  superAdmin: { perms: ['*'], isSuper: true },
  collector: { perms: ['HOME_VIEW', 'WASTE_COLLECTION_CREATE', 'WASTE_COLLECTION_VIEW'], isSuper: false },
  supervisor: { perms: ['HOME_VIEW', 'WASTE_COLLECTION_VIEW', 'ROUTE_ASSIGNMENT_VIEW', 'ROUTE_HCF_VIEW', 'HCF_VIEW', 'REPORT_VIEW'], isSuper: false },
  viewerOnly: { perms: ['HOME_VIEW'], isSuper: false },
  dotStyle: { perms: ['HOME.VIEW', 'WASTE_COLLECTION.CREATE'], isSuper: false },   // dot variants are accepted everywhere
};

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const open = async (perms, isSuper, off) => {
    const ctx = await browser.createBrowserContext(); const page = await ctx.newPage(); await page.setViewport({ width: 390, height: 844, isMobile: true });
    const state = { off, perms, menuCalls: 0 };
    await page.evaluateOnNewDocument((u) => localStorage.setItem('mw-auth-user', JSON.stringify(u)), { id: 'u1', name: 'T', email: 't@t.t', roles: ['admin'], token: 'aaa.bbb.ccc', companyId: isSuper ? '00000000-0000-0000-0000-000000000000' : FX.companies[0].companyId });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (u.port === '3000') {
        const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
        const p = u.pathname; let body;
        if (p.endsWith('/entitlements/me')) body = { success: true, data: meFor(state.off, isSuper) };
        else if (p.endsWith('/auth/permissions')) body = { success: true, data: { userId: 'u1', permissions: state.perms, isSuperAdmin: isSuper } };
        else if (p.endsWith('/auth/menu-config')) { state.menuCalls += 1; body = { success: true, data: state.menuConfig || {} }; }
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
  const visit = async (page, route) => {
    await page.evaluate((x) => { history.pushState({}, '', x); window.dispatchEvent(new PopStateEvent('popstate')); }, route); await sleep(1300);
    return page.evaluate(() => { const t = document.body.innerText; return { url: location.pathname, outcome: /Feature not available/.test(t) ? 'NOT-LICENSED' : (location.pathname === '/not-authorized' || /Not authorized/i.test(t)) ? 'NOT-AUTHORIZED' : 'page' }; });
  };
  const menus = async (page) => {
    await page.evaluate(() => { const b = document.querySelector('.mobile-home-menu-button'); if (b) b.click(); }); await sleep(500);
    return page.evaluate(() => ({ bottom: [...document.querySelectorAll('.mobile-nav-label')].map((x) => x.innerText.trim()), drawer: [...document.querySelectorAll('.mobile-drawer-item-label')].map((x) => x.innerText.trim()) }));
  };
  const closeDrawer = (page) => page.evaluate(() => { const b = document.querySelector('.mobile-drawer-close'); if (b) b.click(); });

  console.log('[1] Users WITH permission lists: every drawer entry matches the permission that opens its screen, and the route agrees');
  for (const [name, prof] of Object.entries(PROFILES)) {
    const { page, ctx } = await open(prof.perms, prof.isSuper, []);
    await visit(page, '/mobile/home'); const m = await menus(page);
    const has = (perm) => prof.isSuper || prof.perms.some((p) => p.replace('.', '_') === perm);
    for (const e of ENTRIES) {
      const want = has(e.perm); const shown = m.drawer.includes(e.label);
      ok(shown === want, `${name}: drawer ${shown ? 'lists' : 'hides'} "${e.label}" (${want ? 'permission held' : 'permission not held'})`, JSON.stringify(m.drawer));
    }
    ok(m.bottom.includes('Home') === has('HOME_VIEW') && m.bottom.includes('Scan') === has('WASTE_COLLECTION_CREATE') && m.bottom.includes('More'), `${name}: bottom bar = Home ${has('HOME_VIEW') ? '+' : '-'} Scan ${has('WASTE_COLLECTION_CREATE') ? '+' : '-'} More`, JSON.stringify(m.bottom));
    await closeDrawer(page);
    let broken = 0;
    for (const e of ENTRIES) {
      const r = await visit(page, e.route); const want = has(e.perm);
      if (want && r.outcome !== 'page') broken += 1;                     // visible entry must open
      if (!want && r.outcome === 'page') { broken += 1; console.log('   !! route opened without the permission: ' + e.route); }  // hidden entry must stay refused
    }
    ok(broken === 0, `${name}: every listed entry opens its screen and no unlisted screen opens (RBAC unchanged)`);
    await ctx.close();
  }

  console.log('[2] Customer entitlements (ENFORCE): a disabled Mobile App screen is not offered, and its route is blocked');
  { const { page, ctx, state } = await open(PROFILES.collector.perms, false, ['MOBILE_APP.SCAN', 'MOBILE_APP.WASTE_ENTRY']);
    await visit(page, '/mobile/home'); let m = await menus(page);
    ok(!m.drawer.includes('Scan Barcode') && !m.drawer.includes('Waste Entry') && m.drawer.includes('Waste Collections'), 'drawer hides Scan Barcode and Waste Entry, keeps Waste Collections', JSON.stringify(m.drawer));
    ok(!m.bottom.includes('Scan') && m.bottom.includes('Home') && m.bottom.includes('More'), 'bottom bar hides Scan', JSON.stringify(m.bottom));
    await closeDrawer(page);
    const scan = await visit(page, '/mobile/scan'); ok(scan.outcome === 'NOT-LICENSED', '/mobile/scan is blocked ("Feature not available")', scan.outcome);
    const coll = await visit(page, '/mobile/waste-collections'); ok(coll.outcome === 'page', '/mobile/waste-collections (still enabled) opens', coll.outcome);
    console.log('   -- refresh without logout or reload');
    await visit(page, '/mobile/home');
    const refresh = async () => { await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await sleep(1100); };
    state.off = []; await refresh(); m = await menus(page);
    ok(m.drawer.includes('Scan Barcode') && m.drawer.includes('Waste Entry') && m.bottom.includes('Scan'), 'entitlement enabled again: Scan / Waste Entry appear in the drawer and the bottom bar, no reload', JSON.stringify(m));
    await closeDrawer(page);
    state.off = ['MOBILE_APP.SCAN']; await refresh(); m = await menus(page);
    ok(!m.drawer.includes('Scan Barcode') && !m.bottom.includes('Scan') && m.drawer.includes('Waste Entry'), 'Scan disabled while the screen is open: it disappears from both menus, no navigation / reload', JSON.stringify(m));
    await closeDrawer(page);
    await ctx.close(); }
  { const { page, ctx } = await open(PROFILES.superAdmin.perms, true, ['MOBILE_APP']);                  // SuperAdmin is never restricted
    await visit(page, '/mobile/home'); const m = await menus(page);
    ok(ENTRIES.every((e) => m.drawer.includes(e.label)) && m.bottom.includes('Scan'), 'SuperAdmin: every entry is offered even with the whole Mobile App disabled for the customer', JSON.stringify(m));
    const r = await visit(page, '/mobile/scan'); ok(r.outcome === 'page', 'SuperAdmin: /mobile/scan opens', r.outcome);
    await ctx.close(); }

  console.log('[3] EMPTY permission list (the case that falls back to /auth/menu-config)');
  { const { page, ctx, state } = await open([], false, []);
    const r = await visit(page, '/mobile/home');
    ok(r.outcome === 'NOT-AUTHORIZED', 'a user with no permissions cannot open the mobile app: the application sends them to Not Authorized (so the menu-config fallback is never reached in practice)', JSON.stringify(r));
    const m = await page.evaluate(() => ({ bottom: document.querySelectorAll('.mobile-nav-label').length, drawer: document.querySelectorAll('.mobile-drawer-item-label').length }));
    ok(m.bottom === 0 && m.drawer === 0, 'no mobile menu is rendered for them', JSON.stringify(m));
    ok(state.menuCalls === 0, '/auth/menu-config is not requested', String(state.menuCalls));
    for (const route of ['/mobile/scan', '/mobile/waste-entry', '/transaction', '/report', '/master']) { const x = await visit(page, route); ok(x.outcome === 'NOT-AUTHORIZED', 'empty list: ' + route + ' stays refused', x.outcome); }
    await ctx.close(); }

  console.log('[4] Module visibility agrees with the REAL backend /auth/menu-config (compiled controller) and the desktop sidebar');
  let AuthController = null;
  try { require('reflect-metadata'); AuthController = require(BE_DIST + '/modules/auth/presentation/auth.controller').AuthController; } catch (e) { console.log('   (compiled backend not found at ' + BE_DIST + ': this section is skipped) ' + e.message); }
  if (AuthController) {
    const config = async (perms) => { const c = Object.create(AuthController.prototype); c.permissionService = { loadUserPermissions: async () => perms }; return (await c.getMenuConfig({ user: { userId: 'u', userRoleId: 'r', email: 'e', userName: 'n' } })).data; };
    const DESK = [['transaction', 'Transaction'], ['finance', 'Finance'], ['commercialAgreements', 'Commercial / Agreements'], ['complianceTraining', 'Compliance & Training'], ['master', 'Master'], ['report', 'Reports']];
    const MODS = {
      'customer admin (all menus)': ['MENU_TRANSACTION_VIEW', 'MENU_FINANCE_VIEW', 'MENU_COMMERCIAL_VIEW', 'MENU_COMPLIANCE_VIEW', 'MENU_MASTER_VIEW', 'MENU_REPORTS_VIEW', 'USER_VIEW'],
      'reports only': ['MENU_REPORTS_VIEW', 'REPORTS_VIEW'],
      'narrow page permissions': ['INVOICE_VIEW', 'CONTRACT_VIEW', 'AGREEMENT_VIEW', 'TRAINING_CERTIFICATE_VIEW', 'ROUTE_ASSIGNMENT_VIEW', 'WASTE_COLLECTION_VIEW', 'USER_VIEW', 'COMPANY_VIEW', 'ROLE_VIEW'],
      'finance + master hubs': ['MENU_FINANCE_VIEW', 'MENU_MASTER_VIEW'],
    };
    for (const [name, perms] of Object.entries(MODS)) {
      const cfg = await config(perms);
      const { page, ctx } = await open(perms, false, []);
      await page.setViewport({ width: 1440, height: 900 }); await visit(page, '/dashboard'); await sleep(500);
      const nav = await page.evaluate(() => [...document.querySelectorAll('.nav-link, .nav-item')].map((a) => a.innerText.trim()).filter(Boolean));
      const diffs = DESK.filter(([k, label]) => cfg[k].visible !== nav.includes(label)).map(([k]) => k);
      ok(diffs.length === 0, `${name}: backend menu-config visible flags == desktop sidebar for all 6 modules`, JSON.stringify({ diffs, cfg: Object.fromEntries(DESK.map(([k]) => [k, cfg[k].visible])), nav }));
      await ctx.close();
    }
  }

  console.log('[5] SuperAdmin tools stay SuperAdmin-only (mobile users included)');
  { const { page, ctx } = await open(PROFILES.supervisor.perms, false, []);
    for (const r of ['/admin/dashboard-configuration', '/admin/permission-configuration', '/admin/customer-entitlements']) { const x = await visit(page, r); ok(x.outcome === 'NOT-AUTHORIZED', 'customer user: ' + r + ' refused', x.outcome); }
    await visit(page, '/mobile/home'); const m = await menus(page); ok(!m.drawer.some((l) => /Configuration|Entitlements/.test(l)), 'the mobile drawer never lists the SuperAdmin tools', JSON.stringify(m.drawer));
    await ctx.close(); }
  { const { page, ctx } = await open(PROFILES.superAdmin.perms, true, []);
    for (const r of ['/admin/permission-configuration', '/admin/customer-entitlements']) { const x = await visit(page, r); ok(x.outcome === 'page', 'SuperAdmin: ' + r + ' opens', x.outcome); }
    await ctx.close(); }

  await browser.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
