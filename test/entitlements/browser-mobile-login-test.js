// Mobile login page: /auth/login and /auth/verify-otp must both send channel: "mobile"; the desktop login must not.
// Run: FE_DIST=<vite build output folder> node test/entitlements/browser-mobile-login-test.js
const path = require('path'), fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../..') + '/node_modules/puppeteer');
const DIST = process.env.FE_DIST;
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : (x || '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const run = async (loginPath, refuse = false) => {
    const bodies = {};
    const ctx = await browser.createBrowserContext(); // clean storage per run
    const page = await ctx.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (u.port === '3000') {
        const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS, body: '' });
        let data = { success: true, data: [] };
        if (refuse && u.pathname.endsWith('/auth/login')) { bodies.login = JSON.parse(req.postData()); return req.respond({ status: 403, contentType: 'application/json', headers: CORS, body: JSON.stringify({ success: false, code: 'FEATURE_NOT_LICENSED', message: 'The Mobile App is not enabled for your organisation. Please contact your administrator.', feature: 'MOBILE_APP' }) }); }
        if (u.pathname.endsWith('/auth/login')) { bodies.login = JSON.parse(req.postData()); const p = { requiresOTP: true, email: 'user@test.com', userId: 'u1', userName: 'user' }; data = { success: true, ...p, data: p }; }
        else if (u.pathname.endsWith('/auth/verify-otp')) { bodies.verify = JSON.parse(req.postData()); const p = { userId: 'u1', userName: 'user', email: 'user@test.com', companyId: 'c1', userRoleId: null, status: 'Active', token: 'aaa.bbb.ccc' }; data = { success: true, ...p, data: p }; }
        else if (u.pathname.endsWith('/auth/permissions')) data = { success: true, data: { permissions: ['HOME_VIEW'], isSuperAdmin: false } };
        else if (u.pathname.endsWith('/entitlements/me')) data = { success: true, data: { mode: 'OFF', tenantMode: 'OFF', version: 'v', isSuperAdmin: false, modules: [], submodules: [], features: [] } };
        return req.respond({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(data) });
      }
      if (u.hostname === 'app.local') {
        let f = path.join(DIST, decodeURIComponent(u.pathname));
        if (u.pathname === '/' || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
        return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
      }
      req.respond({ status: 204, body: '' });
    });
    await page.goto('http://app.local' + loginPath, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(500);
    await page.type('input[type="password"]', 'secret');
    const first = await page.$('input[type="text"], input[type="email"]');
    await first.type('user@test.com');
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await sleep(1200);
    const hasOtp = await page.$('#otp-input-mobile-0');
    if (process.env.DBG) console.log('   otp form:', !!hasOtp, '|', (await page.evaluate(() => document.body.innerText)).slice(0, 220).replace(/\s+/g, ' '), '|', page.url());
    if (hasOtp) {
      for (let i = 0; i < 6; i++) await page.type(`#otp-input-mobile-${i}`, String(i + 1));
      await sleep(200);
      await page.evaluate(() => document.querySelector('button[type="submit"]').click());
      await sleep(1200);
    }
    bodies.text = await page.evaluate(() => document.body.innerText);
    bodies.hasOtp = !!hasOtp;
    await ctx.close();
    return bodies;
  };
  console.log('[mobile login page]');
  const m = await run('/mobile/login');
  ok(m.login && m.login.channel === 'mobile', 'POST /auth/login carries channel: "mobile"', JSON.stringify(m.login));
  ok(m.verify && m.verify.channel === 'mobile', 'POST /auth/verify-otp carries channel: "mobile"', JSON.stringify(m.verify));
  ok(m.login && m.login.usernameOrEmail === 'user@test.com' && m.login.password === 'secret', 'the normal fields are unchanged');
  console.log('[mobile login refused because the Mobile App is disabled]');
  const x = await run('/mobile/login', true);
  ok(/Mobile App is not enabled for your organisation/.test(x.text), 'the 403 message is shown to the user on the mobile login page', x.text.slice(0, 200).replace(/\s+/g, ' '));
  ok(!x.hasOtp && !x.verify, 'no OTP step is shown and nothing is verified');
  console.log('[desktop login page]');
  const d = await run('/login');
  ok(d.login && !('channel' in d.login), 'desktop POST /auth/login sends no channel (unchanged behaviour)', JSON.stringify(d.login));
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
