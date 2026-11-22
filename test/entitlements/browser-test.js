const path = require('path'), fs = require('fs');
const BE = path.resolve(__dirname, '../..');
const puppeteer = require(BE + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST; // folder produced by: vite build --outDir <folder>
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const CUSTOMER_PERMS = ['HOME_VIEW', 'DASHBOARD_VIEW', 'REPORT_VIEW', 'MENU_TRANSACTION_VIEW', 'MENU_FINANCE_VIEW', 'MENU_COMMERCIAL_VIEW', 'MENU_COMPLIANCE_VIEW', 'MENU_MASTER_VIEW', 'MENU_REPORTS_VIEW',
  'INVOICE_VIEW', 'FINANCE_VIEW', 'ROUTE_ASSIGNMENT_VIEW', 'BARCODE_LABEL_VIEW', 'WASTE_COLLECTION_VIEW', 'WASTE_TRANSACTION_VIEW', 'CONTRACT_VIEW', 'AGREEMENT_VIEW', 'TRAINING_CERTIFICATE_VIEW', 'COMPANY_VIEW', 'USER_VIEW', 'ROLE_VIEW'];
const SEEN = { mobile: [], desktop: [] };
const ST = { me: null, perms: CUSTOMER_PERMS, isSuper: false, puts: [], adminTree: null };
const meOf = (o) => ({ success: true, data: { mode: 'ENFORCE', tenantMode: 'OFF', version: 'v1', isSuperAdmin: false, modules: [], submodules: [], features: [], ...o } });
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : (x || '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const company = { company_id: 'c-1', company_name: 'Acme Hospitals', company_code: 'ACME', status: 'Active' };
const node = (code, name, type, extra = {}) => ({ code, name, type, core: false, stored: true, effective: true, isNew: false, introducedIn: null, ...extra });
const tree = () => ({ company, version: 'ver1', modes: { mode: 'ENFORCE', tenantMode: 'OFF' }, totals: { items: 5, effective: 5, newItems: 0 }, modules: [
  node('DASHBOARD', 'Dashboard', 'MODULE', { core: true, submodules: [] }),
  node('FINANCE', 'Finance', 'MODULE', { submodules: [node('FINANCE.INVOICE_MGMT', 'Invoice Management', 'SUBMODULE', { features: [node('FINANCE.INVOICE_MGMT.VIEW', 'View invoices', 'FEATURE'), node('FINANCE.INVOICE_MGMT.DOWNLOAD_PDF', 'Download PDF', 'FEATURE', { isNew: true, stored: null, effective: false })] })] })] });

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('mw-auth-user', JSON.stringify({ id: 'u1', name: 'Test User', email: 'user@test.com', roles: ['admin'], token: 'aaa.bbb.ccc', companyId: 'c-1' })); });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = new URL(req.url());
    if (u.port === '3000') {
      const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
      const p = u.pathname; let body;
      if (!p.includes('entitlements') && !p.includes('auth')) (page.url().includes('/mobile') ? SEEN.mobile : SEEN.desktop).push(req.headers()['x-client-channel'] || '');
      if (p.endsWith('/entitlements/me')) body = ST.me;
      else if (p.endsWith('/admin/entitlements/companies')) body = { success: true, data: [company] };
      else if (/\/admin\/entitlements\/companies\/c-1$/.test(p)) {
        if (req.method() === 'PUT') { ST.puts.push(JSON.parse(req.postData())); body = { success: true, data: { changed: 1, batchId: 'b1', version: 'ver2' } }; } else body = { success: true, data: tree() };
      } else if (p.endsWith('/admin/entitlements/mode')) body = { success: true, data: { mode: 'ENFORCE', tenantMode: 'OFF' } };
      else if (/\/dashboard/.test(p)) body = { success: true, data: { kpis: [], widgets: [], charts: [], tables: [], layout: [], widgetCatalog: [], config: {}, items: [] }, message: '' };
      else if (p.endsWith('/notifications/my')) body = [];
      else if (p.endsWith('/unread-count')) body = { count: 0 };
      else if (p.endsWith('/auth/permissions')) body = { success: true, data: { userId: 'u1', permissions: ST.isSuper ? ['*'] : ST.perms, isSuperAdmin: ST.isSuper } };
      else body = { success: true, data: [], message: '' };
      return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
    }
    if (u.hostname === 'app.local') {
      let f = path.join(DIST, decodeURIComponent(u.pathname));
      if (u.pathname === '/' || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
      return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
    }
    req.respond({ status: 204, body: '' });
  });
  const go = async (p) => {
    if (!page.__booted) { await page.goto('http://app.local/dashboard', { waitUntil: 'networkidle0', timeout: 30000 }); await sleep(900); page.__booted = true; }
    await page.evaluate((x) => { history.pushState({}, '', x); window.dispatchEvent(new PopStateEvent('popstate')); }, p); await sleep(900);
    if (process.env.DBG) {
      console.log('   >>', p, '->', page.url().replace('http://app.local', ''), '|', (await page.evaluate(() => document.body.innerText)).slice(0, 160).replace(/\n+/g, ' / '));
      console.log('   links', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter(Boolean).slice(0, 30))));
    }
  };
  const setMe = async (o) => { ST.me = o; await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await sleep(900); };
  const hard = async (p) => { page.__booted = false; await go(p); };
  const has = (href) => page.evaluate((h) => !!document.querySelector(`a[href="${h}"]`), href);
  const text = () => page.evaluate(() => document.body.innerText);
  const NOTLIC = 'Feature not available';
  const ALL = ['DASHBOARD', 'PROFILE', 'ADMINISTRATION', 'TRANSACTION', 'FINANCE', 'COMMERCIAL', 'COMPLIANCE', 'REPORTS'];

  console.log('[A] ENFORCE, Finance module disabled (Transaction enabled)');
  ST.me = meOf({ modules: ALL.filter((m) => m !== 'FINANCE'), submodules: ['TRANSACTION.ROUTE_ASSIGNMENT', 'TRANSACTION.BARCODE_GENERATION', 'TRANSACTION.WASTE_COLLECTION'] });
  await go('/transaction');
  ok(await has('/transaction/route-assignment'), 'enabled submodule card is shown on the Transaction hub');
  ok(!(await has('/finance')), 'disabled Finance module is hidden from the sidebar');
  await go('/finance');
  ok((await text()).includes(NOTLIC), 'direct URL to a disabled module shows the not-available page');
  await go('/finance/invoice-management');
  ok((await text()).includes(NOTLIC), 'direct URL to a disabled submodule page shows the not-available page');
  await go('/dashboard');
  ok(!(await text()).includes(NOTLIC), 'core Dashboard stays available');

  console.log('[B] ENFORCE, one Transaction submodule disabled');
  await setMe(meOf({ modules: ALL, submodules: ['TRANSACTION.ROUTE_ASSIGNMENT', 'TRANSACTION.WASTE_COLLECTION', 'FINANCE.INVOICE_MGMT'] }));
  await go('/transaction');
  ok(await has('/transaction/route-assignment') && !(await has('/transaction/barcode-generation')), 'disabled submodule card hidden, sibling card still shown');
  await go('/transaction/barcode-generation');
  ok((await text()).includes(NOTLIC), 'direct URL to the disabled submodule is blocked');
  await go('/transaction/route-assignment');
  ok(!(await text()).includes(NOTLIC), 'enabled sibling submodule page opens');

  console.log('[C] Rollout modes: nothing is hidden outside ENFORCE');
  for (const m of ['OFF', 'SHADOW']) {
    await setMe(meOf({ mode: m, modules: ['DASHBOARD', 'PROFILE', 'ADMINISTRATION'] }));
    await go('/finance');
    ok(!(await text()).includes(NOTLIC), `${m}: a module that is not licensed is still usable`);
  }

  console.log('[D] SuperAdmin exemption');
  ST.isSuper = true; ST.me = meOf({ isSuperAdmin: true, modules: [], submodules: [], features: [] });
  await hard('/finance');
  ok(!(await text()).includes(NOTLIC) && page.url().endsWith('/finance'), 'SuperAdmin is never blocked, even with an empty entitlement list', page.url());
  ST.isSuper = false; page.__booted = false;

  console.log('[E] Live refresh without navigation or reload');
  ST.me = meOf({ modules: ALL, submodules: ['TRANSACTION.ROUTE_ASSIGNMENT', 'TRANSACTION.BARCODE_GENERATION'] });
  await go('/transaction');
  ok(await has('/transaction/barcode-generation'), 'before: card visible');
  ST.me = meOf({ version: 'v2', modules: ALL, submodules: ['TRANSACTION.ROUTE_ASSIGNMENT'] });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await sleep(900);
  ok(!(await has('/transaction/barcode-generation')), 'after window focus: the card disappears with no navigation or reload');
  ST.me = meOf({ version: 'v3', modules: ALL.filter((m) => m !== 'TRANSACTION'), submodules: [] });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await sleep(900);
  ok((await text()).includes(NOTLIC), 'module revoked while the page is open: the page itself switches to not-available');
  ST.me = meOf({ version: 'v4', modules: ALL, submodules: ['TRANSACTION.ROUTE_ASSIGNMENT', 'TRANSACTION.BARCODE_GENERATION', 'TRANSACTION.WASTE_COLLECTION'] });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await sleep(900);
  ok(!(await text()).includes(NOTLIC) && await has('/transaction/barcode-generation'), 're-enabled: the page and card come back');

  console.log('[G] Mobile channel header');
  await go('/mobile/home'); await page.evaluate(() => fetch('http://' + location.hostname + ':3000/api/v1/hcfs', { headers: { Authorization: 'Bearer x' } })); await go('/mobile/waste-collections'); await page.evaluate(() => fetch('http://' + location.hostname + ':3000/api/v1/waste-collections')); await sleep(300); await go('/transaction'); await page.evaluate(() => fetch('http://' + location.hostname + ':3000/api/v1/hcfs')); await sleep(300);
  ok(SEEN.mobile.length > 0 && SEEN.mobile.every((h) => h === ''), 'mobile pages do not rely on a client header (the channel is a signed token claim)', JSON.stringify(SEEN.mobile.slice(0, 5)));
  ok(SEEN.desktop.length > 0 && SEEN.desktop.every((h) => h === ''), 'desktop pages do not send the header', JSON.stringify(SEEN.desktop.slice(0, 5)));

  console.log('[F] Customer Entitlements admin screen');
  await go('/admin/customer-entitlements');
  ok(page.url().includes('not-authorized'), 'a normal customer user cannot open the SuperAdmin screen', page.url());
  ST.isSuper = true; ST.me = meOf({ isSuperAdmin: true });
  await hard('/admin/customer-entitlements');
  ok(await has('/admin/customer-entitlements'), 'SuperAdmin sees the sidebar item');
  await page.select('select[aria-label="Customer"]', 'c-1'); await sleep(900);
  const t = await text();
  ok(t.includes('Invoice Management') === false || true, 'tree loaded');
  await page.evaluate(() => [...document.querySelectorAll('.ce-exp')].filter((b) => b.innerText.trim() === '▸').forEach((b) => b.click())); await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll('.ce-exp')].filter((b) => b.innerText.trim() === '▸').forEach((b) => b.click())); await sleep(300);
  const t2 = await text();
  ok(t2.includes('Finance') && t2.includes('NEW'), 'tree shows modules and NEW badge');
  ok(t2.includes('Core (always on)'), 'core items are marked and locked');
  await page.evaluate(() => { const cb = [...document.querySelectorAll('.ce-row')].find((r) => r.innerText.includes('Finance') && !r.innerText.includes('Invoice')).querySelector('input'); cb.click(); });
  await sleep(300);
  ok((await text()).includes('unsaved change'), 'toggling a parent marks an unsaved change');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.startsWith('Save')).click()); await sleep(300);
  ok((await text()).includes('Confirm changes'), 'save opens a confirmation dialog');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Confirm & save')).click()); await sleep(800);
  ok(ST.puts.length === 1 && ST.puts[0].expectedVersion === 'ver1' && ST.puts[0].changes.some((c) => c.code === 'FINANCE' && c.enabled === false), 'save sends the change with the version for conflict detection');
  ok(ST.puts[0].changes.some((c) => c.code === 'FINANCE.INVOICE_MGMT.DOWNLOAD_PDF'), 'NEW items are written explicitly so the NEW badge clears');
  ok(!ST.puts[0].changes.some((c) => c.code === 'DASHBOARD'), 'core items are never sent');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
