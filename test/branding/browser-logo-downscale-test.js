// Real-browser check of the logo helper's downscaling (frontend/src/utils/companyLogo.ts bundled for the browser):
// a real canvas decodes and re-encodes real images. Verifies size, aspect ratio, transparency, JPEG stays JPEG, small logos
// are untouched, and that the result is clearly smaller than the original.
// Env: FE_SRC (frontend/src), ESBUILD (path to esbuild's main js). Uses the backend's puppeteer.
const path = require('path'), fs = require('fs'), os = require('os');
const esbuild = require(process.env.ESBUILD);
const puppeteer = require(path.resolve(__dirname, '../..') + '/node_modules/puppeteer');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

(async () => {
  const stub = { name: 'stub', setup(b) { b.onResolve({ filter: /services\/companyService$/ }, () => ({ path: 'stub', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const companyService = { fetchLogoBlob: (id) => window.__fetch(id) };', loader: 'js' })); } };
  const out = path.join(os.tmpdir(), 'companyLogo.browser.js');
  await esbuild.build({ entryPoints: [path.join(process.env.FE_SRC, 'utils/companyLogo.ts')], bundle: true, format: 'iife', globalName: 'Logo', outfile: out, plugins: [stub], logLevel: 'error' });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(out, 'utf8') });

  const r = await page.evaluate(async () => {
    const draw = (w, h, mime, withAlphaHole) => new Promise((resolve) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      if (mime === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d00'); g.addColorStop(1, '#00d'); x.fillStyle = g; x.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8); // noisy-ish content keeps it big
      for (let i = 0; i < 4000; i++) { x.fillStyle = `hsl(${(i * 37) % 360},70%,50%)`; x.fillRect((i * 131) % w, (i * 71) % h, 6, 6); }
      if (withAlphaHole && mime === 'image/png') x.clearRect(0, 0, w * 0.05, h * 0.05); // transparent corner
      c.toBlob((b) => resolve(b), mime, 0.95);
    });
    const blobs = { big: await draw(4000, 2000, 'image/png', true), bigjpg: await draw(3000, 1500, 'image/jpeg'), small: await draw(300, 150, 'image/png', true) };
    window.__fetch = async (id) => blobs[id];
    const info = {};
    for (const id of Object.keys(blobs)) {
      const logo = await Logo.getCompanyLogo(id);
      const img = new Image(); await new Promise((res) => { img.onload = res; img.src = logo.dataUrl; });
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const corner = x.getImageData(1, 1, 1, 1).data[3]; const center = x.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
      info[id] = { format: logo.format, w: logo.width, h: logo.height, decodedW: img.naturalWidth, decodedH: img.naturalHeight, mime: logo.dataUrl.slice(5, logo.dataUrl.indexOf(';')), originalBytes: blobs[id].size, resultChars: logo.dataUrl.length, cornerAlpha: corner, centerOpaque: center[3] === 255 };
    }
    return info;
  });
  console.log(JSON.stringify(r));
  ok(r.big.w === 800 && r.big.h === 400 && r.big.decodedW === 800 && r.big.decodedH === 400, '4000x2000 PNG -> 800x400, and the image really decodes at that size');
  ok(r.big.mime === 'image/png' && r.big.cornerAlpha === 0 && r.big.centerOpaque, 'PNG transparency is preserved (transparent corner stays transparent, content opaque)');
  ok(r.big.resultChars * 0.75 < r.big.originalBytes, 'the embedded image is smaller than the original upload', `${Math.round(r.big.resultChars * 0.75)} vs ${r.big.originalBytes}`);
  ok(r.bigjpg.format === 'JPEG' && r.bigjpg.mime === 'image/jpeg' && r.bigjpg.w === 800 && r.bigjpg.h === 400, '3000x1500 JPEG -> 800x400 JPEG');
  ok(r.small.w === 300 && r.small.h === 150 && r.small.cornerAlpha === 0, 'a 300x150 logo is not touched (same size, transparency intact)');
  await browser.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); fs.unlinkSync(out); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
