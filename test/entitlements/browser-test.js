const path = require('path'), fs = require('fs');
const BE = path.resolve(__dirname, '../..');
const puppeteer = require(BE + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST; // folder produced by: vite build --outDir <folder>
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const CUSTOMER_PERMS = ['HOME_VIEW', 'DASHBOARD_VIEW', 'REPORT_VIEW', 'MENU_TRANSACTION_VIEW', 'MENU_FINANCE_VIEW', 'MENU_COMMERCIAL_VIEW', 'MENU_COMPLIANCE_VIEW', 'MENU_MASTER_VIEW', 'MENU_REPORTS_VIEW',
  'INVOICE_VIEW', 'FINANCE_VIEW', 'ROUTE_ASSIGNMENT_VIEW', 'BARCODE_LABEL_VIEW', 'WASTE_COLLECTION_VIEW', 'WASTE_TRANSACTION_VIEW', 'CONTRACT_VIEW', 'AGREEMENT_VIEW', 'TRAINING_CERTIFICATE_VIEW', 'COMPANY_VIEW', 'USER_VIEW', 'ROLE_VIEW'];
const SEEN = { mobile: [], desktop: [] };
const ST = { treeDelay: {}, treeVariant: {}, real: false, treeRequests: [], auditRequests: [], me: null, perms: CUSTOMER_PERMS, isSuper: false, puts: [], adminTree: null };
const meOf = (o) => ({ success: true, data: { mode: 'ENFORCE', tenantMode: 'OFF', version: 'v1', isSuperAdmin: false, modules: [], submodules: [], features: [], ...o } });
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : (x || '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Real backend response shapes (camelCase) captured from the running backend: see fixtures/backend-shapes.json
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/backend-shapes.json'), 'utf8'));
const company = { companyId: 'c-1', companyCode: 'ACME', companyName: 'Acme Hospitals', status: 'Active', enabledModules: 1, totalModules: 11, newItems: 0 };
const treeCompany = (c) => ({ companyId: c.companyId, companyCode: c.companyCode, companyName: c.companyName });
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
  page.on('request', async (req) => {
    const u = new URL(req.url());
    if (u.port === '3000') {
      const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
      const p = u.pathname; let body;
      if (!p.includes('entitlements') && !p.includes('auth')) (page.url().includes('/mobile') ? SEEN.mobile : SEEN.desktop).push(req.headers()['x-client-channel'] || '');
      if (p.endsWith('/entitlements/me')) body = ST.me;
      else if (p.endsWith('/admin/entitlements/companies')) body = { success: true, data: ST.real ? FX.companies : [company] };
      else if (ST.real && /\/admin\/entitlements\/companies\/[0-9a-f-]+$/.test(p) && req.method() === 'PUT') { const posted = JSON.parse(req.postData()); ST.puts.push(posted); body = { success: true, data: { changed: posted.changes.length, batchId: 'b-real', version: 'ver-after' } }; }
      else if (ST.real && p.endsWith('/admin/entitlements/shadow-report')) body = { success: true, data: FX.shadow };
      else if (ST.real && p.endsWith('/admin/entitlements/mode') && req.method() === 'GET') body = { success: true, data: FX.mode };
      else if (ST.real && /\/admin\/entitlements\/companies\/[0-9a-f-]+\/audit$/.test(p)) { const id = p.split('/').slice(-2)[0]; ST.auditRequests.push(id); body = { success: true, data: { ...FX.audit, rows: FX.audit.rows.map((r) => ({ ...r, companyId: id })) } }; }
      else if (ST.real && /\/admin\/entitlements\/companies\/[0-9a-f-]+$/.test(p) && req.method() === 'GET') { const id = p.split('/').pop(); ST.treeRequests.push(id); if (ST.treeDelay[id]) await sleep(ST.treeDelay[id]); const c = FX.companies.find((x) => x.companyId === id); body = c ? { success: true, data: { ...(ST.treeVariant[id] ? ST.treeVariant[id](FX.tree) : FX.tree), company: treeCompany(c) } } : { success: false, message: 'Customer not found' }; }
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
  ok(t.includes('Acme Hospitals') && t.includes('Finance'), 'tree loaded for the selected customer (name taken from the backend-shaped response)');
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

  console.log('\n[H] Customer Entitlements with the REAL backend response shapes: four customers, names, ids, selection');
  ST.real = true; ST.isSuper = true; ST.me = meOf({ isSuperAdmin: true });
  await hard('/admin/customer-entitlements'); await sleep(600);
  const opts = await page.evaluate(() => [...document.querySelectorAll('select[aria-label="Customer"] option')].map((o) => ({ label: o.textContent.trim(), value: o.value })));
  const realOpts = opts.filter((o) => o.value);
  ok(realOpts.length === 4, 'the customer dropdown offers the 4 customers', JSON.stringify(opts));
  ok(FX.companies.every((c) => realOpts.some((o) => o.value === c.companyId && o.label === c.companyName + ' (' + c.companyCode + ')')), 'every option has the real company id as value and "<name> (<code>)" as label', JSON.stringify(opts));
  ok(realOpts.every((o) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(o.value)) && !realOpts.some((o) => /undefined/.test(o.label) || o.label.startsWith('(')), 'no blank or undefined labels, every value is a UUID');
  for (const c of FX.companies) {
    ST.treeRequests.length = 0;
    await page.select('select[aria-label="Customer"]', c.companyId); await sleep(900);
    const txt = await text();
    ok(ST.treeRequests.length >= 1 && ST.treeRequests.every((id) => id === c.companyId), c.companyCode + ': selecting it requests exactly that customer\'s entitlements', JSON.stringify(ST.treeRequests));
    ok(txt.includes('Finance') && txt.includes('Dashboard'), c.companyCode + ': the module tree of the selected customer is shown');
    ok(!/undefined|NaN/.test(txt), c.companyCode + ': no "undefined" / "NaN" anywhere on the page');
  }
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Audit history/i.test(b.innerText)).click()); await sleep(900);
  const auditTxt = await text();
  ok(ST.auditRequests.length >= 1 && ST.auditRequests.every((id) => FX.companies.some((c) => c.companyId === id)), 'Audit history requests the audit of the selected customer', JSON.stringify(ST.auditRequests));
  ok(FX.audit.rows.every((r) => auditTxt.includes(r.entityCode)) && auditTxt.includes('BACKFILL') && !/Invalid Date|undefined/.test(auditTxt), 'audit rows show entity code, action and a valid date (real backend row shape)', auditTxt.slice(0, 200).replace(/\s+/g, ' '));
  ST.real = false;

  console.log('\n[I] Redesigned page (real backend shapes): header, tabs, toolbar, cards, list, bulk actions, save/discard, responsive');
  ST.real = true; ST.isSuper = true; ST.me = meOf({ isSuperAdmin: true }); ST.puts.length = 0;
  await page.setViewport({ width: 1440, height: 900 });
  await hard('/admin/customer-entitlements'); await sleep(700);
  const q = (fn, arg) => page.evaluate(fn, arg);
  // 1 header
  const hero = await q(() => { const h = document.querySelector('.ce-hero'); return h && { title: h.querySelector('h2')?.innerText, desc: h.querySelector('p')?.innerText, icon: !!h.querySelector('.ce-hero-icon svg'), modes: [...h.querySelectorAll('.ce-pill')].map((x) => x.innerText) }; });
  ok(hero && hero.title === 'Customer Entitlements' && hero.icon && /modules, submodules and features/.test(hero.desc), 'header: icon, title and description', JSON.stringify(hero));
  ok(hero && hero.modes.length === 2 && hero.modes.every((m) => m === 'OFF'), 'header shows the real rollout modes (OFF / OFF) from the API', JSON.stringify(hero && hero.modes));
  ok((await text()).includes('Home'), 'the standard breadcrumb header is still present (Home / ... / Customer Entitlements)');
  // 2 tabs
  const tabs = await q(() => [...document.querySelectorAll('.ce-tabs button')].map((b) => ({ t: b.innerText.trim(), on: b.classList.contains('on'), dis: b.disabled })));
  ok(JSON.stringify(tabs.map((x) => x.t)) === JSON.stringify(['Configuration', 'Audit History', 'Rollout']) && tabs[0].on && tabs[1].dis, 'tabs: Configuration (active), Audit History (disabled until a customer is chosen), Rollout', JSON.stringify(tabs));
  ok((await text()).includes('Choose a customer to view and change what they can use.'), 'empty state asks for a customer');
  // 3 toolbar: dropdown and search on one horizontal row
  const tb = await q(() => { const s = document.querySelector('select[aria-label="Customer"]').getBoundingClientRect(), i = document.querySelector('input[aria-label="Search entitlements"]').getBoundingClientRect(); return { sameRow: Math.abs(s.top - i.top) < 6, selW: Math.round(s.width), inW: Math.round(i.width), searchDisabled: document.querySelector('input[aria-label="Search entitlements"]').disabled }; });
  ok(tb.sameRow && tb.selW > 200 && tb.inW > 200 && tb.searchDisabled, 'toolbar: customer dropdown and search side by side; search disabled until a customer is loaded', JSON.stringify(tb));
  // select the first customer
  const C1 = FX.companies[0];
  await page.select('select[aria-label="Customer"]', C1.companyId); await sleep(1000);
  // 4 summary cards (real totals)
  const cards = async () => q(() => [...document.querySelectorAll('.ce-card')].slice(0, 4).map((c) => ({ label: c.querySelector('.ce-card-label').innerText, value: c.querySelector('strong').innerText.replace(/\s+/g, '') })));
  let cv = await cards(); const T = FX.tree.totals;
  ok(cv.length === 4 && cv[0].value === String(T.items) && cv[1].value === String(T.effective) && cv[2].value === String(T.items - T.effective) && cv[3].value === FX.tree.modules.filter((m) => m.effective).length + '/' + FX.tree.modules.length, 'cards: total ' + T.items + ' / active ' + T.effective + ' / disabled ' + (T.items - T.effective) + ' / modules ' + FX.tree.modules.length + '/' + FX.tree.modules.length + ' (real totals)', JSON.stringify(cv));
  ok((await text()).includes(T.effective + ' of ' + T.items + ' items active'), 'the "' + T.effective + ' of ' + T.items + ' items active" summary is kept');
  // 5/6 hierarchy + status visuals
  const rowsClosed = await q(() => document.querySelectorAll('.ce-tree > .ce-node').length);
  ok(rowsClosed === FX.tree.modules.length, 'one card per module (' + rowsClosed + ')');
  const kidsClosed = await q(() => document.querySelectorAll('.ce-children').length);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Expand all').click()); await sleep(300);
  const all = await q(() => ({ rows: document.querySelectorAll('.ce-row').length, d0: document.querySelectorAll('.ce-depth-0 > .ce-row').length, d1: document.querySelectorAll('.ce-depth-1 > .ce-row').length, d2: document.querySelectorAll('.ce-depth-2 > .ce-row').length }));
  ok(kidsClosed === 0 && all.rows === T.items, 'collapsed by default; "Expand all" reveals all ' + T.items + ' rows (modules, submodules, features)', JSON.stringify([kidsClosed, all]));
  ok(all.d0 === FX.tree.modules.length && all.d1 === FX.tree.modules.reduce((a, m) => a + m.submodules.length, 0) && all.d2 === FX.tree.modules.reduce((a, m) => a + m.submodules.reduce((b, x) => b + (x.features || []).length, 0), 0), 'hierarchy intact: module / submodule / feature counts match the API', JSON.stringify(all));
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Collapse all').click()); await sleep(300);
  ok((await q(() => document.querySelectorAll('.ce-row').length)) === FX.tree.modules.length, '"Collapse all" folds everything back to the module cards');
  const one = await q(() => { const b = document.querySelector('.ce-tree > .ce-node .ce-exp'); b.click(); return null; }); await sleep(250);
  ok((await q(() => document.querySelectorAll('.ce-tree > .ce-node:first-child .ce-children').length)) === 1, 'a single module expands on click'); await q(() => document.querySelector('.ce-tree > .ce-node .ce-exp').click()); await sleep(200);
  ok((await q(() => document.querySelectorAll('.ce-tree > .ce-node:first-child .ce-children').length)) === 0, 'and collapses again');
  const core = await q(() => { const r = [...document.querySelectorAll('.ce-row.ce-core')][0]; if (!r) return null; const cs = getComputedStyle(r); return { text: r.innerText.includes('Core (always on)'), switchDisabled: r.querySelector('input').disabled, border: cs.borderLeftColor }; });
  const act = await q(() => { const r = [...document.querySelectorAll('.ce-row.ce-active')][0]; const b = r.querySelector('.ce-badge.ce-active'); return { badge: b && getComputedStyle(b).backgroundColor, border: getComputedStyle(r).borderLeftColor, text: b && b.innerText }; });
  ok(core && core.text && core.switchDisabled, 'Core rows: labelled "Core (always on)" and locked', JSON.stringify(core));
  ok(act.text === 'Active' && act.badge === 'rgb(220, 252, 231)' && act.border === 'rgb(22, 163, 74)', 'Active rows: green badge and green edge', JSON.stringify(act));
  ok(core.border !== act.border, 'Core and Active use different visual treatment');
  // 7 bulk: Disable all (red) -> everything but core is disabled, cards update live, rows turn red
  const colors = await q(() => { const en = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Enable all' && b.closest('.ce-listbar')); const di = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Disable all' && b.closest('.ce-listbar')); return { en: getComputedStyle(en).color, enBg: getComputedStyle(en).backgroundColor, di: getComputedStyle(di).color, diBg: getComputedStyle(di).backgroundColor }; });
  ok(colors.enBg === 'rgb(220, 252, 231)' && colors.diBg === 'rgb(254, 226, 226)', 'Enable all is green, Disable all is red', JSON.stringify(colors));
  const coreCount = await q(() => document.querySelectorAll('.ce-row.ce-core').length);
  await page.evaluate(() => [...document.querySelectorAll('.ce-listbar button')].find((b) => b.innerText.trim() === 'Disable all').click()); await sleep(400);
  cv = await cards();
  const coreTotal = FX.tree.modules.reduce((n, m) => { let c = 0; const w = (x) => { if (x.core) c++; (x.submodules || x.features || []).forEach(w); }; w(m); return n + c; }, 0);
  ok(Number(cv[1].value) === coreTotal && Number(cv[2].value) === T.items - coreTotal, 'bulk "Disable all": Active falls to the ' + coreTotal + ' core items, Disabled rises to ' + (T.items - coreTotal) + ' (cards update live)', JSON.stringify(cv));
  const saveInfo = await text();
  ok(/\d+ unsaved changes/.test(saveInfo) && /to disable/.test(saveInfo), 'save bar counts the unsaved changes and splits them into enable / disable', (saveInfo.match(/\d+ unsaved change[^\n]*/) || [''])[0]);
  const dis = await q(() => { const r = [...document.querySelectorAll('.ce-row.ce-disabled')][0]; const b = r.querySelector('.ce-badge.ce-inactive'); return { badge: b && b.innerText, bg: b && getComputedStyle(b).backgroundColor, border: getComputedStyle(r).borderLeftColor }; });
  ok(dis.badge === 'Disabled' && dis.bg === 'rgb(254, 226, 226)' && dis.border === 'rgb(220, 38, 38)', 'Disabled rows: red badge and red edge', JSON.stringify(dis));
  // Discard restores everything
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Discard').click()); await sleep(900);
  cv = await cards();
  ok(Number(cv[1].value) === T.effective && /0 unsaved changes/.test(await text()), 'Discard restores the saved state (cards and the unsaved counter)', JSON.stringify(cv));
  ok(ST.puts.length === 0, 'nothing was sent to the server by bulk actions or Discard');
  // per-module bulk + single toggle + parent/child behaviour
  await q(() => document.querySelector('.ce-tree > .ce-node .ce-exp').click()); await sleep(250);
  await q(() => { const row = document.querySelector('.ce-tree > .ce-node:not(:has(.ce-core))') ; });
  const mod = await q(() => { const nodes = [...document.querySelectorAll('.ce-tree > .ce-node')]; const n = nodes.find((x) => !x.querySelector(':scope > .ce-row.ce-core')); const row = n.querySelector(':scope > .ce-row'); return { name: row.querySelector('.ce-title').innerText, idx: nodes.indexOf(n) }; });
  await q((i) => { const n = document.querySelectorAll('.ce-tree > .ce-node')[i]; if (!n.querySelector('.ce-children')) n.querySelector(':scope > .ce-row .ce-exp').click(); }, mod.idx); await sleep(250);
  await q((i) => { document.querySelectorAll('.ce-tree > .ce-node')[i].querySelector(':scope > .ce-row input').click(); }, mod.idx); await sleep(300);
  const parentOff = await q((i) => { const n = document.querySelectorAll('.ce-tree > .ce-node')[i]; const kid = n.querySelector('.ce-children .ce-row'); return { parentChecked: n.querySelector(':scope > .ce-row input').checked, kidChecked: kid.querySelector('input').checked, kidBadge: kid.querySelector('.ce-badge:last-child').innerText, parentBadge: n.querySelector(':scope > .ce-row .ce-badge:last-child').innerText, dirty: n.querySelector(':scope > .ce-row').classList.contains('ce-dirty') }; }, mod.idx);
  ok(!parentOff.parentChecked && parentOff.kidChecked && /parent off/.test(parentOff.kidBadge) && parentOff.dirty, 'turning a parent off keeps the children\'s own setting, shows them as "Inactive (parent off)" and marks the row unsaved', JSON.stringify(parentOff));
  cv = await cards(); ok(Number(cv[1].value) < T.effective && Number(cv[3].value.split('/')[0]) === FX.tree.modules.length - 1, 'cards react: Active drops and enabled modules = ' + (FX.tree.modules.length - 1) + ' after disabling "' + mod.name + '"', JSON.stringify(cv));
  // save: confirm dialog + payload
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.startsWith('Save')).click()); await sleep(300);
  ok((await text()).includes('Confirm changes for ' + C1.companyName) && (await text()).includes('→'), 'Save Changes opens the confirmation with the customer name and the change list');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Confirm & save')).click()); await sleep(900);
  ok(ST.puts.length === 1 && ST.puts[0].changes.length === 1 && ST.puts[0].changes[0].enabled === false && ST.puts[0].expectedVersion === FX.tree.version, 'exactly the one edited item is saved (enabled:false) with the version for conflict detection', JSON.stringify(ST.puts[0] && ST.puts[0].changes));
  ok((await q(() => document.querySelector('.ce-savebar-info strong').innerText)) === '0 unsaved changes', 'after saving the page reloads and shows 0 unsaved changes');
  // search
  await page.type('input[aria-label="Search entitlements"]', 'Finance'); await sleep(400);
  const found = await q(() => ({ rows: document.querySelectorAll('.ce-row').length, texts: [...document.querySelectorAll('.ce-title')].slice(0, 3).map((x) => x.innerText) }));
  ok(found.rows > 0 && found.rows < T.items && found.texts.some((x) => /Finance/i.test(x)), 'search filters the tree and auto-expands the matches (' + found.rows + ' rows)', JSON.stringify(found));
  await page.evaluate(() => { const i = document.querySelector('input[aria-label="Search entitlements"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ''); i.dispatchEvent(new Event('input', { bubbles: true })); }); await sleep(300);
  // 2 tabs: audit and rollout
  await page.evaluate(() => [...document.querySelectorAll('.ce-tabs button')].find((b) => /Audit History/.test(b.innerText)).click()); await sleep(900);
  const au = await q(() => ({ rows: document.querySelectorAll('.ce-audit tbody tr').length, chips: document.querySelectorAll('.ce-audit .ce-badge').length, active: document.querySelector('.ce-tabs button.on').innerText }));
  ok(au.rows === FX.audit.rows.length && au.chips >= au.rows * 2 && au.active === 'Audit History', 'Audit History tab: ' + au.rows + ' real rows with Enabled/Disabled and action chips', JSON.stringify(au));
  await page.evaluate(() => [...document.querySelectorAll('.ce-tabs button')].find((b) => b.innerText === 'Rollout').click()); await sleep(900);
  const ro = await q(() => ({ segs: [...document.querySelectorAll('.ce-segment')].map((s) => [...s.querySelectorAll('button')].map((b) => b.innerText + (b.classList.contains('on') ? '*' : ''))), cards: [...document.querySelectorAll('.ce-cards-small .ce-card')].map((c) => c.innerText.replace(/\s+/g, ' ')), json: !!document.querySelector('.ce-shadow') }));
  ok(ro.segs.length === 2 && ro.segs.every((g) => g.join() === 'OFF*,SHADOW,ENFORCE'), 'Rollout tab: both switches show OFF selected, with SHADOW / ENFORCE available', JSON.stringify(ro.segs));
  ok(ro.cards.length === 3 && ro.json && /days observed/i.test(ro.cards[0]), 'Rollout tab: report summary tiles and the full report', JSON.stringify(ro.cards));
  ok(ST.puts.length === 1, 'no mode change was sent (nothing clicked)');
  // responsive
  console.log('   -- responsive layouts');
  await page.evaluate(() => [...document.querySelectorAll('.ce-tabs button')].find((b) => b.innerText === 'Configuration').click()); await sleep(600);
  for (const [w, h, cols, label] of [[1440, 900, 4, 'desktop'], [1280, 800, 4, 'laptop'], [1024, 768, 2, 'small laptop / tablet landscape'], [820, 1180, 2, 'tablet portrait'], [390, 844, 1, 'phone']]) {
    await page.setViewport({ width: w, height: h }); await sleep(500);
    const m = await q(() => { const g = getComputedStyle(document.querySelector('.ce-cards')).gridTemplateColumns.split(' ').length; const over = document.documentElement.scrollWidth > innerWidth + 1; const sel = document.querySelector('select[aria-label="Customer"]').getBoundingClientRect(); const sb = document.querySelector('.ce-savebar'); const r = sb && sb.getBoundingClientRect(); return { cols: g, hscroll: over, selVisible: sel.width > 150 && sel.right <= innerWidth, saveInView: !!r && r.right <= innerWidth + 1 }; });
    ok(m.cols === cols && !m.hscroll && m.selVisible && m.saveInView, label + ' (' + w + 'px): ' + cols + ' card column(s), no horizontal scroll, controls fit', JSON.stringify(m));
    await page.screenshot({ path: path.join(process.env.SHOT_DIR || require('os').tmpdir(), 'shot-' + w + '.png') }).catch(() => {});
  }
  await page.setViewport({ width: 1440, height: 900 });
  ST.real = false;

  console.log('\n[J] Layout: page width, no horizontal scroll, footer never overlaps content, footer at the bottom of short pages');
  ST.real = true; ST.isSuper = true; ST.me = meOf({ isSuperAdmin: true });
  const probe = () => page.evaluate(() => {
    const c = document.querySelector('.app-layout__content'); const pg = document.querySelector('.ce-page'); const hero = document.querySelector('.ce-hero');
    const fh = parseFloat(getComputedStyle(c, '::after').height) || 0; const hasFooter = getComputedStyle(c, '::after').content !== 'none' && fh > 0;
    const cr = c.getBoundingClientRect(), pr = pg.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    let cb = 0; pg.querySelectorAll('*').forEach((e) => { const r = e.getBoundingClientRect(); if (r.height > 0 && r.bottom > cb) cb = r.bottom; });
    const wrapBottom = pr.bottom - cr.top + c.scrollTop, shrunk = pg.scrollHeight > pr.height + 1;
    const footerTop = shrunk ? wrapBottom : c.scrollHeight - fh;
    const sb = document.querySelector('.ce-savebar'); const sbr = sb && sb.getBoundingClientRect();
    return { vw: innerWidth, vh: innerHeight, cw: cr.width, pageW: pr.width, heroGapL: hr.left - cr.left, heroGapR: cr.right - hr.right, shrunk, wrapperH: pr.height, contentH: pg.scrollHeight,
      hasFooter, fh, overlap: (cb - cr.top + c.scrollTop) - footerTop, footerBottom: footerTop + fh, scrollH: c.scrollHeight, scrollTop: c.scrollTop, ch: cr.height,
      hscroll: document.documentElement.scrollWidth > innerWidth + 1 || c.scrollWidth > c.clientWidth + 1,
      saveBarAboveFooter: sbr ? (footerTop - (sbr.bottom - cr.top + c.scrollTop)) >= -1 : true };
  });
  const bottom = async () => { await page.evaluate(() => { const c = document.querySelector('.app-layout__content'); c.scrollTop = c.scrollHeight; }); await sleep(250); };
  const top = async () => { await page.evaluate(() => { document.querySelector('.app-layout__content').scrollTop = 0; }); await sleep(150); };
  let sawFooter = false;
  for (const [w, h] of [[1440, 900], [1920, 1080], [2560, 1300], [1280, 800], [820, 1180], [390, 844]]) {
    await page.setViewport({ width: w, height: h }); await hard('/admin/customer-entitlements'); await sleep(600);
    const tag = w + 'px';
    let m = await probe(); sawFooter = sawFooter || m.hasFooter;
    ok(!m.shrunk && !m.hscroll && m.overlap <= 1, tag + ' no customer: wrapper keeps its content height, no horizontal scroll, nothing under the footer', JSON.stringify({ shrunk: m.shrunk, hscroll: m.hscroll, overlap: m.overlap }));
    if (m.hasFooter) ok(Math.abs(m.footerBottom - m.scrollH) < 3 && m.scrollH <= m.ch + 1 && Math.abs(m.footerBottom - m.ch) < 3, tag + ' short page: the footer sits at the bottom of the viewport', JSON.stringify({ footerBottom: m.footerBottom, ch: m.ch, scrollH: m.scrollH }));
    const wide = w >= 1024 ? (m.heroGapL >= 20 && m.heroGapL <= 33 && m.heroGapR >= 20 && m.heroGapR <= 33 || w >= 2560) : (m.heroGapL >= 14 && m.heroGapL <= 18);
    ok(wide, tag + ': side padding is ' + (w >= 1024 ? '24-32px (left ' + Math.round(m.heroGapL) + ', right ' + Math.round(m.heroGapR) + ')' : '16px') + (w >= 2560 ? ' (capped, centred)' : ''), JSON.stringify({ l: m.heroGapL, r: m.heroGapR }));
    if (w >= 1024 && w < 2560) ok(m.pageW >= m.cw - 1, tag + ': the page uses the full available width (' + Math.round(m.pageW) + ' of ' + Math.round(m.cw) + ')');
    if (w >= 2560) ok(m.pageW <= 1841 && Math.abs(m.heroGapL - m.heroGapR) < 3, tag + ': very wide screens: content capped at 1840px and centred', JSON.stringify({ pageW: m.pageW, l: m.heroGapL, r: m.heroGapR }));
    await page.select('select[aria-label="Customer"]', FX.companies[0].companyId); await sleep(1100);
    m = await probe();
    ok(!m.shrunk && m.overlap <= 1 && !m.hscroll, tag + ' customer, collapsed: no overlap, no horizontal scroll', JSON.stringify({ shrunk: m.shrunk, overlap: m.overlap }));
    await page.evaluate(() => [...document.querySelectorAll('.ce-listbar button')].find((b) => b.innerText.trim() === 'Expand all').click()); await sleep(500);
    await top(); m = await probe();
    ok(!m.shrunk && m.contentH > m.ch * 3, tag + ' expanded: the page is long (' + Math.round(m.contentH) + 'px) and the wrapper is as tall as its content', JSON.stringify({ shrunk: m.shrunk, contentH: m.contentH, ch: m.ch }));
    await bottom(); m = await probe();
    ok(m.overlap <= 1 && !m.hscroll, tag + ' expanded, scrolled to the end: the last row ends ' + (m.hasFooter ? 'above the footer' : 'at the end of the content') + ', no overlap', JSON.stringify({ overlap: m.overlap }));
    if (m.hasFooter) ok(Math.abs(m.footerBottom - m.scrollH) < 3, tag + ' the footer is the very last thing in the document', JSON.stringify({ footerBottom: m.footerBottom, scrollH: m.scrollH }));
    await page.evaluate(() => { const n = [...document.querySelectorAll('.ce-tree > .ce-node')].find((x) => x.querySelector(':scope > .ce-row.ce-active')); n.querySelector(':scope > .ce-row input').click(); }); await sleep(300);
    await bottom(); m = await probe();
    ok(/1 unsaved change/.test(await text()) && m.saveBarAboveFooter && m.overlap <= 1, tag + ' unsaved changes: the Save Changes bar is above the footer and nothing overlaps', JSON.stringify({ saveBarAboveFooter: m.saveBarAboveFooter, overlap: m.overlap }));
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Discard').click()); await sleep(600);
  }
  console.log('   footer present in this build: ' + (sawFooter ? 'yes (footer checks ran)' : 'no (footer CSS is not part of this build; footer checks skipped, overlap checks still ran)'));
  await page.setViewport({ width: 1440, height: 900 });
  ST.real = false;

  console.log('[N] Switching between customers never shows the previous customer\'s entitlements (even when an older response arrives late)');
  { ST.real = true; ST.isSuper = true; ST.me = meOf({ isSuperAdmin: true }); ST.puts.length = 0;
    const [A, B] = [FX.companies[0], FX.companies[1]];
    // customer A has FINANCE (a module and everything under it) switched OFF; B has everything on. A's answer is slow, B's is fast.
    const offFinance = (t) => { const c = JSON.parse(JSON.stringify(t)); let off = 0; const w = (n, parentOff) => { const isOff = parentOff || (n.type === 'MODULE' && n.code === 'FINANCE'); if (isOff && !n.core) { n.stored = false; n.effective = false; off += 1; } (n.submodules || n.features || []).forEach((k) => w(k, isOff)); }; c.modules.forEach((m) => w(m, false)); c.totals = { ...c.totals, effective: c.totals.items - off }; return c; };
    ST.treeVariant[A.companyId] = offFinance; ST.treeDelay[A.companyId] = 1500; ST.treeDelay[B.companyId] = 0;
    await hard('/admin/customer-entitlements'); await sleep(600);
    await page.select('select[aria-label="Customer"]', A.companyId);
    await sleep(150);
    await page.select('select[aria-label="Customer"]', B.companyId);        // switch away before A's slow answer arrives
    await sleep(2500);                                                      // A's late answer has now arrived
    const cards = await page.evaluate(() => [...document.querySelectorAll('.ce-card')].slice(0, 4).map((c) => c.querySelector('strong').innerText.replace(/\s+/g, '')));
    const T = FX.tree.totals;
    ok(cards[1] === String(T.effective) && cards[2] === '0', 'selected B, A answered later: the page shows B (' + T.effective + ' active, 0 disabled), not A', JSON.stringify(cards));
    const dirty = await page.evaluate(() => document.querySelector('.ce-savebar-info strong').innerText); ok(dirty === '0 unsaved changes', 'and no phantom unsaved changes appear from the other customer\'s data', dirty);
    ST.treeDelay = {}; await page.select('select[aria-label="Customer"]', A.companyId); await sleep(900);
    const a2 = await page.evaluate(() => [...document.querySelectorAll('.ce-card')].slice(0, 4).map((c) => c.querySelector('strong').innerText.replace(/\s+/g, '')));
    ok(Number(a2[2]) > 0, 'selecting A afterwards shows A\'s own state (some items disabled)', JSON.stringify(a2));
    await page.select('select[aria-label="Customer"]', B.companyId); await sleep(900);
    const b2 = await page.evaluate(() => [...document.querySelectorAll('.ce-card')].slice(0, 4).map((c) => c.querySelector('strong').innerText.replace(/\s+/g, '')));
    ok(b2[2] === '0' && b2[1] === String(T.effective), 'switching back to B shows B again with nothing carried over from A', JSON.stringify(b2));
    ST.treeVariant = {}; ST.treeDelay = {}; ST.real = false; }

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
