// "Not authorized" page: design-system layout, actions, responsive behaviour (footer, horizontal scroll), direct URL and refresh behaviour.
// UI test only: it checks that the page is shown to users who are refused and that nothing becomes accessible because of it.
// Real frontend build (FE_DIST) + stubbed API. Run: FE_DIST=<vite build output> node test/entitlements/browser-not-authorized-test.js
const path = require('path'), fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../..') + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const open = async (perms, w, h) => {
    const ctx = await browser.createBrowserContext(); const page = await ctx.newPage(); await page.setViewport({ width: w, height: h });
    await page.evaluateOnNewDocument((u) => localStorage.setItem('mw-auth-user', JSON.stringify(u)), { id: 'u1', name: 'Test User', email: 't@t.t', roles: ['admin'], token: 'aaa.bbb.ccc', companyId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (u.port === '3000') {
        const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
        const p = u.pathname; let body;
        if (p.endsWith('/auth/permissions')) body = { success: true, data: { userId: 'u1', permissions: perms, isSuperAdmin: perms.includes('*') } };
        else if (p.endsWith('/entitlements/me')) body = { success: true, data: { mode: 'OFF', tenantMode: 'OFF', version: 'v', isSuperAdmin: false, modules: [], submodules: [], features: [] } };
        else if (/\/dashboard/.test(p)) body = { success: true, data: { kpis: [], widgets: [], charts: [], tables: [], layout: [], widgetCatalog: [], config: {}, items: [] }, message: '' };
        else if (p.endsWith('/notifications/my')) body = []; else if (p.endsWith('/unread-count')) body = { count: 0 };
        else body = { success: true, data: [], message: '' };
        return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
      }
      if (u.hostname === 'app.local') { let f = path.join(DIST, decodeURIComponent(u.pathname)); if (u.pathname === '/' || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html'); return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); }
      req.respond({ status: 204, body: '' });
    });
    await page.goto('http://app.local/dashboard', { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {}); await sleep(900);
    return { page, ctx };
  };
  const go = async (page, route) => { await page.evaluate((x) => { history.pushState({}, '', x); window.dispatchEvent(new PopStateEvent('popstate')); }, route); await sleep(1600); };
  const measure = (page) => page.evaluate(() => {
    const c = document.querySelector('.app-layout__content'); if (!c) return { noLayout: true };
    const cs = getComputedStyle(c, '::after'); const fh = parseFloat(cs.height) || 0; const hasFooter = cs.content !== 'none' && fh > 0;
    const cr = c.getBoundingClientRect(); const card = document.querySelector('.na-card'); const kr = card && card.getBoundingClientRect();
    const wrap = document.querySelector('.na-wrap'); const wr = wrap && wrap.getBoundingClientRect();
    let cb = 0; document.querySelectorAll('.na-wrap *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.height > 0 && r.bottom > cb) cb = r.bottom; });
    const footerTop = c.scrollHeight - fh;
    const cssIcon = document.querySelector('.na-icon'); const btn = document.querySelector('.na-btn--primary');
    return { hasFooter, footerH: fh, scrollH: c.scrollHeight, clientH: c.clientHeight, footerTop, contentBottom: cb - cr.top + c.scrollTop, overlap: (cb - cr.top + c.scrollTop) - footerTop,
      footerAtBottom: Math.abs(c.scrollHeight - (c.scrollTop + c.clientHeight)) < 3 || c.scrollHeight <= c.clientHeight + 1, hscroll: document.documentElement.scrollWidth > innerWidth + 1 || c.scrollWidth > c.clientWidth + 1,
      sidebar: !!document.querySelector('.app-layout__sidebar'), header: !!document.querySelector('.page-header, .dashboard-header'), standaloneAside: !!document.querySelector('.dashboard-sidebar'),
      cardCentered: kr ? Math.abs((kr.left + kr.right) / 2 - (cr.left + cr.right) / 2) < 3 : false, cardW: kr ? kr.width : 0, cardFitsContainer: kr ? kr.left >= cr.left - 1 && kr.right <= cr.right + 1 : false,
      wrapShrunk: wrap ? wrap.scrollHeight > wr.height + 1 : null, iconSvg: !!document.querySelector('.na-icon svg'), iconBg: cssIcon && getComputedStyle(cssIcon).backgroundColor, btnBg: btn && getComputedStyle(btn).backgroundColor,
      cardBorder: card && getComputedStyle(card).borderTopColor, cardRadius: card && getComputedStyle(card).borderTopLeftRadius, font: card && getComputedStyle(card).fontFamily,
      title: (document.querySelector('.na-title') || {}).innerText, requested: (document.querySelector('.na-meta-value') || {}).innerText, buttons: [...document.querySelectorAll('.na-btn')].map((b) => b.innerText.trim()), primaryHref: (document.querySelector('.na-btn--primary') || {}).getAttribute && document.querySelector('.na-btn--primary').getAttribute('href'),
      nav: [...document.querySelectorAll('.nav-link, .nav-item')].map((a) => a.innerText.trim()).filter(Boolean), bodyText: document.body.innerText };
  });
  const PARTIAL = ['DASHBOARD_VIEW', 'MENU_REPORTS_VIEW', 'REPORTS_VIEW'];

  console.log('[1] design: shared layout, icon, explanation, actions (a user with some permissions is refused /transaction)');
  { const { page, ctx } = await open(PARTIAL, 1440, 900); await go(page, '/transaction'); const m = await measure(page);
    ok(m.sidebar && m.header && !m.standaloneAside, 'uses the shared application layout (same sidebar and page header as other pages, no private sidebar)', JSON.stringify({ sidebar: m.sidebar, header: m.header, standalone: m.standaloneAside }));
    ok(m.iconSvg && /254, 226, 226/.test(m.iconBg || ''), 'shows an access-denied icon (shield with a cross) on the application\'s red-soft tone', String(m.iconBg));
    ok(m.title === 'Not authorized' && /don.t have permission to access this page/i.test(m.bodyText) && /administrator/i.test(m.bodyText), 'concise explanation: title and "you don\'t have permission ... contact your administrator"');
    ok(m.requested === '/transaction', 'shows which page was requested', m.requested);
    ok(JSON.stringify(m.buttons) === JSON.stringify(['Go to Dashboard', 'Go back']) && m.primaryHref === '/dashboard', 'actions: "Go to Dashboard" (primary, links to /dashboard) and "Go back"', JSON.stringify([m.buttons, m.primaryHref]));
    ok(/226, 232, 240/.test(m.cardBorder || '') && m.cardRadius === '12px' && /Inter/.test(m.font || '') && /15, 23, 42/.test(m.btnBg || ''), 'card follows the app conventions (1px #e2e8f0 border, 12px radius, Inter, slate-900 primary button)', JSON.stringify([m.cardBorder, m.cardRadius, m.font, m.btnBg]));
    ok(m.nav.length > 0 && m.nav.includes('Dashboard') && m.nav.includes('Reports') && !m.nav.includes('Transaction'), 'sidebar is the shared one and still follows RBAC (Dashboard + Reports only)', JSON.stringify(m.nav));
    ok(page.url().endsWith('/not-authorized') && !/Transaction hub|Route Assignment/i.test(m.bodyText), 'the refused page itself is not rendered or reachable from here', page.url());
    await ctx.close(); }

  console.log('[2] responsive layouts: card centred, no horizontal scroll, footer at the bottom of the page and never overlapping');
  for (const [w, h, tag] of [[1920, 1080, 'desktop 1920'], [1440, 900, 'desktop 1440'], [1280, 800, 'laptop 1280'], [820, 1180, 'tablet 820'], [390, 844, 'mobile 390'], [390, 500, 'mobile, short viewport']]) {
    const { page, ctx } = await open(PARTIAL, w, h); await go(page, '/transaction'); const m = await measure(page);
    ok(!m.hscroll && m.cardCentered && m.cardFitsContainer && m.wrapShrunk === false, tag + ': card centred and fully visible, no horizontal scroll, content keeps its height', JSON.stringify({ hscroll: m.hscroll, centred: m.cardCentered, fits: m.cardFitsContainer, shrunk: m.wrapShrunk, cardW: m.cardW }));
    if (m.hasFooter) ok(m.overlap <= 1, tag + ': footer never overlaps the card or the buttons', 'overlap ' + m.overlap);
    if (m.hasFooter && h >= 700) ok(m.footerAtBottom, tag + ': short content - the footer sits at the bottom of the viewport', JSON.stringify({ scrollH: m.scrollH, clientH: m.clientH }));
    if (m.hasFooter && h < 700) ok(m.footerTop >= m.contentBottom - 1, tag + ': tall content on a short screen - the footer follows the content (scrolls after it)', JSON.stringify({ footerTop: m.footerTop, contentBottom: m.contentBottom }));
    if (!m.hasFooter) console.log('   (this build has no footer CSS: footer checks skipped for ' + tag + ')');
    await ctx.close(); }

  console.log('[3] actions');
  { const { page, ctx } = await open(PARTIAL, 1440, 900); await go(page, '/transaction');
    await page.evaluate(() => [...document.querySelectorAll('.na-btn')].find((b) => b.innerText.trim() === 'Go back').click()); await sleep(1200);
    ok(new URL(page.url()).pathname === '/dashboard', '"Go back" returns to the page the user came from', page.url());
    await go(page, '/transaction'); await page.evaluate(() => document.querySelector('.na-btn--primary').click()); await sleep(1200);
    ok(new URL(page.url()).pathname === '/dashboard', '"Go to Dashboard" opens the dashboard', page.url());
    await ctx.close(); }

  console.log('[4] direct URL and refresh (no access is granted by reloading)');
  { const { page, ctx } = await open(PARTIAL, 1440, 900); await go(page, '/transaction');
    await page.reload({ waitUntil: 'networkidle0' }); await sleep(1500);
    let m = await measure(page); ok(page.url().endsWith('/not-authorized') && m.title === 'Not authorized' && m.requested === '/transaction', 'refresh on the Not authorized page keeps the page and the requested path', page.url() + ' ' + m.requested);
    await page.goto('http://app.local/transaction', { waitUntil: 'networkidle0' }); await sleep(1500);
    m = await measure(page); ok(page.url().endsWith('/not-authorized') && m.title === 'Not authorized' && m.requested === '/transaction', 'direct URL of a refused page (hard load) ends on Not authorized, showing the requested path', page.url() + ' ' + m.requested);
    await page.goto('http://app.local/admin/customer-entitlements', { waitUntil: 'networkidle0' }); await sleep(1500);
    m = await measure(page); ok(page.url().endsWith('/not-authorized') && m.requested === '/admin/customer-entitlements', 'direct URL of a SuperAdmin tool by a customer user: Not authorized', page.url() + ' ' + m.requested);
    await ctx.close(); }
  { const { page, ctx } = await open(PARTIAL, 1440, 900);   // fresh page: no history state from an earlier refusal
    await page.goto('http://app.local/not-authorized', { waitUntil: 'networkidle0' }); await sleep(1500);
    ok(new URL(page.url()).pathname === '/dashboard', 'opening /not-authorized directly with no refusal behind it sends a permitted user to the dashboard (existing behaviour kept)', page.url());
    await ctx.close(); }
  { const { page, ctx } = await open([], 1440, 900);   // no permissions at all
    await go(page, '/transaction'); const m = await measure(page);
    ok(page.url().endsWith('/not-authorized') && m.title === 'Not authorized' && m.sidebar, 'a user with NO permissions sees the same page inside the shared layout', page.url());
    ok(!m.hscroll && m.cardCentered, 'and it is laid out correctly', JSON.stringify({ hscroll: m.hscroll, centred: m.cardCentered }));
    for (const r of ['/transaction', '/report', '/master', '/finance']) { await go(page, r); ok(page.url().endsWith('/not-authorized'), 'no permissions: ' + r + ' stays refused', page.url()); }
    await ctx.close(); }

  await browser.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
