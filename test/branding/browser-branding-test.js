// Frontend branding in a real headless browser with a stubbed API: application logo (login, loading screen, sidebar,
// favicon), Application Branding visible only to SuperAdmin, company logo in Company Master, and the copyright footer on
// authenticated screens. Env: FE_DIST (vite build output folder). Uses the backend's puppeteer.
const path = require('path'), fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../..') + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const COMPANY = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DIST_BEFORE = process.env.FE_DIST_BEFORE;
const SRC_CSS = process.env.FE_SRC;
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : (x || '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const state = { logo404: false, hasLogo: true, super: false, permsDelay: 0, access: 'auto', wildcard: false, dist: null, logoRequests: [], companyLogoAuth: [] };
  const newPage = async (user) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    if (user) await page.evaluateOnNewDocument((u) => { localStorage.setItem('mw-auth-user', JSON.stringify(u)); }, user);
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      const u = new URL(req.url());
      if (u.port === '3000') {
        const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
        const p = u.pathname;
        if (p.endsWith('/branding/app-logo/meta')) return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ success: true, data: state.hasLogo ? { hasLogo: true, version: 7, url: '/branding/app-logo?v=7' } : { hasLogo: false, version: 0, url: null } }) });
        if (p.endsWith('/branding/app-logo') && state.logo404) return req.respond({ status: 404, contentType: 'application/json', headers: CORS, body: '{}' });
        if (p.endsWith('/branding/app-logo')) { state.logoRequests.push(req.method()); return req.respond({ status: 200, contentType: 'image/png', headers: CORS, body: PNG }); }
        if (/\/companies\/[0-9a-f-]+\/logo$/.test(p)) { state.companyLogoAuth.push(req.headers().authorization || ''); return req.respond({ status: 200, contentType: 'image/png', headers: CORS, body: PNG }); }
        if (p.endsWith('/branding/access')) { state.accessCalls = (state.accessCalls || 0) + 1; if (state.access === '500') return req.respond({ status: 500, contentType: 'application/json', headers: CORS, body: '{}' }); if (state.access === '401') return req.respond({ status: 401, contentType: 'application/json', headers: CORS, body: '{}' }); const can = state.access === 'auto' ? state.super : state.access === true; return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ success: true, data: { canManageBranding: can } }) }); }
        if (p.endsWith('/auth/permissions')) { if (state.permsDelay) await sleep(state.permsDelay); return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ success: true, data: { userId: 'u1', permissions: (state.super || state.wildcard) ? ['*'] : ['COMPANY_VIEW', 'COMPANY_EDIT', 'MENU_MASTER_VIEW', 'HOME_VIEW', 'DASHBOARD_VIEW'], isSuperAdmin: state.super && !state.wildcard } }) }); }
        if (p.endsWith('/companies')) return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ success: true, data: [{ id: COMPANY, companyCode: 'ACME', companyName: 'Acme Hospitals Ltd', status: 'Active', logoUrl: `/companies/${COMPANY}/logo?v=3`, logoUpdatedAt: new Date().toISOString() }], message: '' }) });
        const body = /\/dashboard/.test(p) ? { success: true, data: { kpis: [], widgets: [], charts: [], tables: [], layout: [], widgetCatalog: [], config: {}, items: [] }, message: '' } : p.endsWith('/notifications/my') ? [] : p.endsWith('/unread-count') ? { count: 0 } : { success: true, data: [], message: '' };
        return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
      }
      if (u.hostname === 'app.local') {
        let f = path.join(state.dist || DIST, decodeURIComponent(u.pathname));
        if (u.pathname === '/' || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(state.dist || DIST, 'index.html');
        return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
      }
      req.respond({ status: 204, body: '' });
    });
    return { page, ctx };
  };
  const USER = { id: 'u1', name: 'Test User', email: 'user@test.com', roles: ['admin'], token: 'aaa.bbb.ccc', companyId: COMPANY };
  const go = async (page, p, wait = 900) => { await page.goto('http://app.local' + p, { waitUntil: 'networkidle0', timeout: 30000 }); await sleep(wait); };
  const nav = async (page, p) => { await page.evaluate((x) => { history.pushState({}, '', x); window.dispatchEvent(new PopStateEvent('popstate')); }, p); await sleep(900); };

  console.log('[1] Application Logo configured: login pages, favicon, CSS variable');
  state.hasLogo = true;
  let { page, ctx } = await newPage(null);
  await go(page, '/login');
  let r = await page.evaluate(() => ({ img: [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /app-logo/.test(s || '')), html: document.documentElement.getAttribute('data-app-logo'), css: document.documentElement.style.getPropertyValue('--app-logo-url'), fav: document.querySelector('link[data-app-branding="favicon"]')?.getAttribute('href') || null, text: document.body.innerText }));
  ok(r.img.length > 0 && /branding\/app-logo\?v=7/.test(r.img[0]), 'desktop login page shows the application logo (cache-busted URL)', JSON.stringify(r.img));
  ok(r.html === 'true' && /app-logo\?v=7/.test(r.css), 'logo published to the document (data-app-logo + --app-logo-url)');
  ok(r.fav && /branding\/app-logo\?v=7/.test(r.fav), 'favicon points at the application logo');
  ok(!/Copyright (QuadrupleIndia|TpointTech)/.test(await page.evaluate(() => document.body.innerText)) && !(await page.evaluate(() => !!document.querySelector('.dashboard-main'))), 'login page has no footer container (footer is for authenticated screens)');
  await go(page, '/mobile/login');
  r = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /app-logo/.test(s || '')));
  ok(r.length > 0, 'mobile login page shows the application logo');
  await ctx.close();

  console.log('\n[2] loading screen (ProtectedRoute) shows the logo');
  state.permsDelay = 2500; ({ page, ctx } = await newPage(USER));
  await page.goto('http://app.local/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(900);
  r = await page.evaluate(() => ({ text: document.body.innerText, img: [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /app-logo/.test(s || '')) }));
  ok(/Loading/.test(r.text) && r.img.length > 0, 'while the app is loading, the loading screen shows the application logo', JSON.stringify(r).slice(0, 160));
  state.permsDelay = 0; await ctx.close();

  console.log('\n[3] sidebar brand tile on authenticated screens');
  state.super = true; ({ page, ctx } = await newPage(USER));
  await go(page, '/dashboard');
  for (const p of ['/dashboard', '/transaction', '/finance', '/master', '/report']) {
    await nav(page, p);
    const s = await page.evaluate(() => { const el = document.querySelector('.sidebar-header .brand .logo-container'); if (!el) return { none: true }; const cs = getComputedStyle(el); return { bg: cs.backgroundImage, svgHidden: el.querySelector(':scope > svg') ? getComputedStyle(el.querySelector(':scope > svg')).display === 'none' : null }; });
    ok(!s.none && /app-logo/.test(s.bg), `${p}: the sidebar brand tile uses the application logo`, JSON.stringify(s));
  }
  await ctx.close();

  console.log('\n[4] copyright footer on authenticated screens');
  state.super = true; ({ page, ctx } = await newPage(USER));
  await go(page, '/dashboard');
  const ROUTES = ['/dashboard', '/transaction', '/finance', '/commercial-agreements', '/compliance-training', '/master', '/master/company', '/report', '/report/invoice', '/profile', '/admin/permission-configuration'];
  let bad = 0;
  for (const p of ROUTES) {
    await nav(page, p);
    const m = await page.evaluate(() => { const el = document.querySelector('.dashboard-main, .app-layout__content, .dashboard-shell__main'); if (!el) return { none: true, url: location.pathname }; const cs = getComputedStyle(el, '::after'); return { content: cs.content, h: parseFloat(cs.height) || 0, url: location.pathname }; });
    const good = !m.none && /\u00A9 Copyright TpointTech\.com\. All Rights Reserved\./.test(m.content) && !/Quadruple/.test(m.content) && m.h > 15;
    if (!good) { bad++; console.log('   problem', p, JSON.stringify(m)); }
  }
  ok(bad === 0, `the same footer text is rendered on all ${ROUTES.length} checked authenticated routes`);
  await page.setViewport({ width: 390, height: 844 }); await nav(page, '/master');
  const mob = await page.evaluate(() => { const el = document.querySelector('.dashboard-main'); const cs = el ? getComputedStyle(el, '::after') : null; return { content: cs && cs.content, h: cs && parseFloat(cs.height), hscroll: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(/Copyright/.test(mob.content || '') && !mob.hscroll, 'footer also fits a phone-width viewport without horizontal scrolling', JSON.stringify(mob));
  await ctx.close();

  console.log('\n[5] Application Branding visible only to SuperAdmin; Company Logo in Company Master');
  state.super = false; ({ page, ctx } = await newPage(USER));
  await go(page, '/dashboard'); await nav(page, '/master/company');
  r = await page.evaluate(() => ({ btn: [...document.querySelectorAll('button')].some((b) => /Application Branding/.test(b.innerText)), rows: document.body.innerText.includes('Acme Hospitals') }));
  ok(r.rows && !r.btn, 'customer user: Company Master loads, NO Application Branding button');
  await ctx.close();
  state.super = true; ({ page, ctx } = await newPage(USER));
  await go(page, '/dashboard'); await nav(page, '/master/company');
  r = await page.evaluate(() => ({ btn: [...document.querySelectorAll('button')].some((b) => /Application Branding/.test(b.innerText)) }));
  ok(r.btn, 'SuperAdmin: the compact Application Branding button is shown in the Company Master toolbar');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Application Branding/.test(b.innerText)).click()); await sleep(600);
  r = await page.evaluate(() => ({ modal: !!document.querySelector('.app-branding-modal'), text: (document.querySelector('.app-branding-modal') || {}).innerText || '', file: !!document.querySelector('.app-branding-modal input[type=file]') }));
  ok(r.modal && /logo/i.test(r.text) && r.file, 'the modal opens with the logo upload control');
  await page.evaluate(() => { const c = document.querySelector('.app-branding-modal button[aria-label="Close"], .app-branding-modal .cm-filter-close'); (c || [...document.querySelectorAll('.app-branding-modal button')].find((b) => /close|cancel/i.test(b.innerText || b.getAttribute('aria-label') || ''))).click(); }); await sleep(300);
  ok(!(await page.evaluate(() => !!document.querySelector('.app-branding-modal'))), 'the modal closes');
  await page.evaluate(() => document.querySelector('button[title="Edit"]').click()); await sleep(900);
  r = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src') || '').filter((s) => s.startsWith('blob:')));
  ok(r.length > 0, 'Edit company: the current company logo is shown (fetched with the user\'s token as a blob)');
  ok(state.companyLogoAuth.length > 0 && state.companyLogoAuth.every((a) => a === 'Bearer aaa.bbb.ccc'), 'the company logo request carries the Authorization header', JSON.stringify(state.companyLogoAuth));
  await ctx.close();

  const btnShown = async (label, setup, expect) => {
    setup(); const c = await newPage(USER); await go(c.page, '/dashboard'); await nav(c.page, '/master/company');
    const b = await c.page.evaluate(() => ({ btn: [...document.querySelectorAll('button')].some((x) => /Application Branding/.test(x.innerText)), rows: document.body.innerText.includes('Acme Hospitals') }));
    ok(b.rows && b.btn === expect, label, JSON.stringify(b)); await c.ctx.close();
  };
  await btnShown('wildcard (*) user whose /branding/access says false: NO button', () => { state.super = false; state.wildcard = true; state.access = false; }, false);
  await btnShown('customer user (access=false): NO button', () => { state.super = false; state.wildcard = false; state.access = false; }, false);
  await btnShown('/branding/access answers 500: fail closed, NO button even for a * user', () => { state.super = false; state.wildcard = true; state.access = '500'; }, false);
  await btnShown('/branding/access answers 401: fail closed, NO button', () => { state.super = false; state.wildcard = true; state.access = '401'; }, false);
  await btnShown('designated SuperAdmin (access=true): button shown', () => { state.super = true; state.wildcard = false; state.access = true; }, true);
  await btnShown('no wildcard permission but access=true (OTP-login SuperAdmin): button shown', () => { state.super = false; state.wildcard = false; state.access = true; }, true);
  state.super = false; state.wildcard = false; state.access = 'auto';

  console.log('\n[6] no Application Logo configured: nothing is applied');
  state.hasLogo = false; state.super = true; ({ page, ctx } = await newPage(null));
  await go(page, '/login');
  r = await page.evaluate(() => ({ img: [...document.querySelectorAll('img')].filter((i) => /app-logo/.test(i.getAttribute('src') || '')).length, html: document.documentElement.getAttribute('data-app-logo'), fav: !!document.querySelector('link[data-app-branding="favicon"]') }));
  ok(r.img === 0 && r.html === null && !r.fav, 'no logo image, no data-app-logo attribute, no replaced favicon (existing look unchanged)', JSON.stringify(r));
  await ctx.close();

  console.log('\n[7] a configured logo whose file cannot be loaded falls back to the default look');
  state.hasLogo = true; state.logo404 = true; state.super = true; ({ page, ctx } = await newPage(USER));
  await go(page, '/dashboard', 1500);
  r = await page.evaluate(() => { const el = document.querySelector('.sidebar-header .brand .logo-container'); const svg = el && el.querySelector(':scope > svg'); return { attr: document.documentElement.getAttribute('data-app-logo'), svgShown: svg ? getComputedStyle(svg).display !== 'none' : null, fav: !!document.querySelector('link[data-app-branding="favicon"]') }; });
  ok(r.attr === null && r.svgShown === true && !r.fav, 'logo URL answers 404: the sidebar keeps its default mark (no empty tile), favicon unchanged', JSON.stringify(r));
  await ctx.close();
  ({ page, ctx } = await newPage(null)); await go(page, '/login', 1500);
  r = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => /app-logo/.test(i.getAttribute('src') || '')).length);
  ok(r === 0, 'login page shows no broken image when the logo cannot be loaded');
  await ctx.close(); state.logo404 = false;

  console.log('\n[8] Application Branding is a compact modal, not a permanent section; it does not touch company logos');
  state.hasLogo = true; state.super = true; ({ page, ctx } = await newPage(USER));
  await go(page, '/dashboard'); await nav(page, '/master/company');
  const closed = await page.evaluate(() => ({ perm: !!document.querySelector('[class*="app-branding"]'), height: document.documentElement.scrollHeight }));
  ok(!closed.perm, 'with the modal closed there is no Application Branding section on the page (no permanent block, no extra spacing)');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Application Branding/.test(b.innerText)).click()); await sleep(600);
  const box = await page.evaluate(() => { const m = document.querySelector('.app-branding-modal'); const b = m.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), vw: innerWidth, vh: innerHeight, overlay: getComputedStyle(m.parentElement).position }; });
  ok(box.w <= 640 && box.w < box.vw * 0.6 && box.h < box.vh, `the modal is compact (${box.w}x${box.h}px in a ${box.vw}x${box.vh} window), floating over the page`, JSON.stringify(box));
  ok(box.overlay === 'fixed', 'it floats over the page as an overlay (position: fixed)');
  await page.evaluate(() => (document.querySelector('.app-branding-modal button[aria-label="Close"]') || [...document.querySelectorAll('.app-branding-modal button')].find((b) => /close|cancel/i.test(b.innerText))).click()); await sleep(300);
  ok((await page.evaluate(() => document.documentElement.scrollHeight)) === closed.height, 'closing the modal restores the exact page height');
  await page.evaluate(() => document.querySelector('button[title="Edit"]').click()); await sleep(900);
  const imgs = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src') || ''));
  ok(imgs.some((s) => s.startsWith('blob:')) && !imgs.some((s) => /branding\/app-logo/.test(s) && s.startsWith('blob:')), 'the company form shows the COMPANY logo (blob), the application logo is only in the sidebar/head');
  const sideBg = await page.evaluate(() => getComputedStyle(document.querySelector('.sidebar-header .brand .logo-container')).backgroundImage);
  ok(/app-logo/.test(sideBg) && !/companies\//.test(sideBg), 'the sidebar keeps showing the application logo, not a company logo');
  await ctx.close();

  console.log('\n[9] copyright footer on mobile pages (390x844), text single-sourced');
  const MOBILE = ['/mobile/home', '/mobile/scan', '/mobile/waste-entry', '/mobile/waste-collections', '/mobile/assign-hospital', '/mobile/assigned-hcfs', '/mobile/analytics', '/mobile/hcf-master', '/mobile/profile', '/mobile/settings'];
  const FOOT = /^"© Copyright TpointTech\.com\. All Rights Reserved\."$/;
  const toEnd = () => { window.scrollTo(0, 1e6); document.querySelectorAll('*').forEach((e) => { const o = getComputedStyle(e).overflowY; if ((o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1) e.scrollTop = 1e6; }); };
  const footInfo = () => {
    const pick = ['.mobile-page-content', '.mobile-login-container', '.mobile-login-page', '.app-shell'].map((s) => document.querySelector(s)).find(Boolean);
    if (!pick) return { none: true, url: location.pathname };
    const cs = getComputedStyle(pick, '::after'); const main = pick.getBoundingClientRect();
    const nav = document.querySelector('.mobile-bottom-nav, nav[class*="mobile"]'); const navTop = nav ? nav.getBoundingClientRect().top : null;
    // footer box = bottom of the content box minus its own height (pseudo-element is the last in-flow item)
    const h = parseFloat(cs.height) || 0; const pb = parseFloat(getComputedStyle(pick).paddingBottom) || 0;
    const footBottom = main.bottom - pb; // viewport coords, measured with the page scrolled to its end
    return { cls: pick.className, content: cs.content, h, display: cs.display, hscroll: document.documentElement.scrollWidth > innerWidth + 1, footBottom, navTop, pb, url: location.pathname };
  };
  state.super = true; state.wildcard = false; state.access = 'auto'; state.dist = null;
  ({ page, ctx } = await newPage(USER)); await page.setViewport({ width: 390, height: 844 });
  await go(page, '/mobile/home');
  for (const p of MOBILE) {
    await nav(page, p);
    await page.evaluate(toEnd); await sleep(250);
    const m = await page.evaluate(footInfo);
    ok(!m.none && FOOT.test(m.content) && m.h > 15 && !m.hscroll && m.display === 'block', `${p}: footer text rendered, not hidden, no horizontal scroll`, JSON.stringify(m));
    if (m.navTop !== null) ok(m.footBottom <= m.navTop + 1, `${p}: footer is not covered by the fixed bottom navigation (${Math.round(m.footBottom)} <= ${Math.round(m.navTop)})`, JSON.stringify(m));
  }
  await nav(page, '/mobile/users/new');
  let mu = await page.evaluate(footInfo);
  ok(!mu.none && FOOT.test(mu.content) && mu.h > 15 && !mu.hscroll, '/mobile/users/new (AppShell): footer rendered', JSON.stringify(mu));
  await ctx.close();
  ({ page, ctx } = await newPage(null)); await page.setViewport({ width: 390, height: 844 });
  await go(page, '/mobile/login');
  mu = await page.evaluate(footInfo);
  ok(!mu.none && FOOT.test(mu.content) && mu.h > 15 && !mu.hscroll, '/mobile/login: footer rendered, no horizontal scroll', JSON.stringify(mu));
  await ctx.close();
  console.log('   NOTE pages/mobile/LoginPage.tsx is not routed anywhere (dead file): covered only by the shared CSS selector .mobile-login-page, not browser-testable');

  console.log('\n[10] desktop: same text everywhere, no old text in the built bundle, single source');
  const strings = (() => { const out = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(js|css|html)$/.test(e.name)) out.push(f); } }; walk(DIST); return out; })();
  const hits = strings.filter((f) => /TpointTech\.com/.test(fs.readFileSync(f, 'utf8')));
  const old = strings.filter((f) => /Copyright QuadrupleIndia/.test(fs.readFileSync(f, 'utf8')));
  ok(hits.length === 1 && /\.css$/.test(hits[0]), 'built bundle: the footer text exists in exactly one place (one CSS file)', JSON.stringify(hits));
  ok(old.length === 0, 'built bundle: the old "Copyright QuadrupleIndia" text is gone');
  if (SRC_CSS) {
    const walkSrc = (d, acc = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walkSrc(f, acc); else if (/\.(tsx?|css)$/.test(e.name)) acc.push(f); } return acc; };
    const srcHits = walkSrc(SRC_CSS).filter((f) => /All Rights Reserved/.test(fs.readFileSync(f, 'utf8')));
    ok(srcHits.length === 1 && /appFooter\.css$/.test(srcHits[0]), 'source: the copyright text is defined only in appFooter.css', JSON.stringify(srcHits));
  }

  if (DIST_BEFORE) {
    console.log('\n[11] layout preservation: mobile pages before (no footer CSS) vs after, content boxes of every child of main');
    const measure = () => {
      const main = document.querySelector('.mobile-page-content'); if (!main) return null;
      const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
      const kids = [...main.children].map((c) => ({ tag: c.tagName + '.' + String(c.className).slice(0, 30), box: r(c) }));
      return { main: r(main), kids, hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
    };
    const shot = async (dist, p) => { state.dist = dist; const c = await newPage(USER); await c.page.setViewport({ width: 390, height: 844 }); await go(c.page, '/dashboard'); await nav(c.page, p); await sleep(500); const m = await c.page.evaluate(measure); await c.ctx.close(); return m; };
    for (const p of MOBILE) {
      const a = await shot(DIST_BEFORE, p), b = await shot(DIST, p);
      if (!a || !b) { ok(false, `${p}: could not measure`, JSON.stringify({ a: !!a, b: !!b })); continue; }
      const same = a.kids.length === b.kids.length && a.kids.every((k, i) => k.tag === b.kids[i].tag && k.box.join() === b.kids[i].box.join());
      const dMain = b.main[3] - a.main[3];
      ok(same, `${p}: every content child keeps its position and size (${a.kids.length} children); main grew ${dMain}px (footer)`, same ? '' : JSON.stringify({ before: a.kids, after: b.kids }));
    }
    state.dist = null;
    console.log('\n[12] desktop layout: only the footer text differs (dashboard-main children unchanged)');
    const measureD = () => { const main = document.querySelector('.dashboard-main, .app-shell'); if (!main) return null; return [...main.children].map((c) => { const b = c.getBoundingClientRect(); return c.tagName + '.' + String(c.className).slice(0, 30) + ':' + [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)].join(','); }); };
    for (const p of ['/dashboard', '/master/company', '/users/new']) {
      const res = [];
      for (const d of [DIST_BEFORE, DIST]) { state.dist = d; const c = await newPage(USER); await go(c.page, '/dashboard'); await nav(c.page, p); res.push(await c.page.evaluate(measureD)); await c.ctx.close(); }
      ok(res[0] && res[1] && res[0].join('|') === res[1].join('|'), `${p}: desktop content boxes identical before/after`, JSON.stringify(res).slice(0, 300));
    }
    state.dist = null;
  } else console.log('\n[11] SKIPPED: FE_DIST_BEFORE not set');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
