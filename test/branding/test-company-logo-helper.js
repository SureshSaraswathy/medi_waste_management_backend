// frontend/src/utils/companyLogo.ts (the helper behind logos in PDFs, receipts, agreements and exported reports),
// bundled with esbuild and run with small DOM stand-ins. The point: it picks the logo of the DOCUMENT's company, and
// every failure (no logo, empty file, undecodable image, network error) yields null - never an exception.
// Env: FE_SRC (frontend/src folder), ESBUILD (path to esbuild's main js, e.g. <frontend>/node_modules/esbuild/lib/main.js).
const path = require('path'), fs = require('fs'), os = require('os');
const esbuild = require(process.env.ESBUILD);
const FE_SRC = process.env.FE_SRC;
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

(async () => {
  const stub = { name: 'stub-company-service', setup(b) { b.onResolve({ filter: /services\/companyService$/ }, () => ({ path: 'stub', namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const companyService = { fetchLogoBlob: (id) => globalThis.__fetchLogoBlob(id) };', loader: 'js' })); } };
  const out = path.join(os.tmpdir(), 'companyLogo.bundle.js');
  await esbuild.build({ entryPoints: [path.join(FE_SRC, 'utils/companyLogo.ts')], bundle: true, format: 'cjs', platform: 'node', outfile: out, plugins: [stub], logLevel: 'error' });

  // DOM stand-ins
  const calls = [];
  globalThis.FileReader = class { readAsDataURL(blob) { setTimeout(() => { this.result = `data:${blob.type};base64,${blob.__b64 || 'AAAA'}`; this.onload(); }, 0); } };
  globalThis.Image = class { set src(v) { setTimeout(() => { if (/BAD/.test(v)) this.onerror(); else { const big = /BIGSRC/.test(v), tall = /TALLSRC/.test(v); this.naturalWidth = /SVGZERO/.test(v) ? 0 : big ? 4000 : tall ? 1000 : 200; this.naturalHeight = /SVGZERO/.test(v) ? 0 : big ? 2000 : tall ? 3000 : 100; this.onload(); } }, 0); } };
  const canvasLog = []; globalThis.document = { createElement: () => { const c = { width: 0, height: 0, getContext: () => (globalThis.__noCtx ? null : { drawImage() {} }), toDataURL: (type, q) => { canvasLog.push({ type, q, w: c.width, h: c.height }); return 'data:' + (type || 'image/png') + ';base64,' + (globalThis.__bigOut ? 'X'.repeat(5000) : 'RASTER'); } }; return c; } };
  const store = {}; globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const mkBlob = (type, b64, size = 10) => ({ type, size, __b64: b64 });
  const helper = require(out);

  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  let flakyCalls = 0;
  globalThis.__fetchLogoBlob = async (id) => { calls.push(id); if (id === A) return mkBlob('image/png', 'PNGDATA'); if (id === B) return mkBlob('image/jpeg', 'JPGDATA'); if (id === 'empty') return mkBlob('image/png', '', 0); if (id === 'nologo') return null; if (id === 'bad') return mkBlob('image/png', 'BAD'); if (id === 'net') throw new Error('network down'); if (id === 'svg') return mkBlob('image/svg+xml', 'SVGDATA'); if (id === 'svgzero') return mkBlob('image/svg+xml', 'SVGZERO'); if (id === 'bigpng') return mkBlob('image/png', 'BIGSRC' + 'A'.repeat(400)); if (id === 'bigjpg') return mkBlob('image/jpeg', 'BIGSRC' + 'A'.repeat(400)); if (id === 'tallpng') return mkBlob('image/png', 'TALLSRC' + 'A'.repeat(400)); if (id === 'smallpng') return mkBlob('image/png', 'PNGDATA'); if (id === 'hang') return new Promise(() => {}); if (id === 'flaky') { flakyCalls++; if (flakyCalls === 1) throw new Error('network blip'); return mkBlob('image/png', 'PNGDATA'); } if (id === 'flaky404') { flakyCalls++; return flakyCalls === 1 ? null : mkBlob('image/png', 'PNGDATA'); } return null; };

  console.log('[1] the logo of the document\'s own company');
  let a = await helper.getCompanyLogo(A), b = await helper.getCompanyLogo(B);
  ok(a && a.format === 'PNG' && /PNGDATA/.test(a.dataUrl) && a.width === 200 && a.height === 100, 'company A -> its own PNG with natural size');
  ok(b && b.format === 'JPEG' && /JPGDATA/.test(b.dataUrl), 'company B -> its own JPEG, never A\'s');
  ok(JSON.stringify(calls) === JSON.stringify([A, B]), 'each lookup asked the server for exactly that company', JSON.stringify(calls));
  await helper.getCompanyLogo(A); ok(calls.length === 2, 'repeat lookups are cached briefly (no extra request)');
  helper.clearCompanyLogoCache(A); await helper.getCompanyLogo(A); ok(calls.length === 3, 'clearing the cache after a logo change forces a fresh fetch');
  const s = await helper.getCompanyLogo('svg'); ok(s && s.format === 'PNG' && /RASTER/.test(s.dataUrl), 'an SVG logo is rasterised to PNG for jsPDF / html2canvas');
  const sz = await helper.getCompanyLogo('svgzero'); ok(sz && sz.width >= 1 && sz.height >= 1, 'an SVG without width/height gets a sane box (no zero-size image)');
  const fit = helper.fitLogo({ dataUrl: '', format: 'PNG', width: 400, height: 100 }, 80, 40); ok(fit.width === 80 && fit.height === 20, 'fitLogo keeps the aspect ratio (400x100 into 80x40 -> 80x20)', JSON.stringify(fit));

  console.log('\n[2] failures never break document generation');
  for (const [id, why] of [['nologo', 'company has no logo'], ['empty', 'empty file'], ['bad', 'undecodable image'], ['net', 'network error']]) {
    let threw = false, v; try { v = await helper.getCompanyLogo(id); } catch { threw = true; }
    ok(!threw && v === null, `${why} -> null, no exception`);
  }
  ok(await helper.getCompanyLogo(null) === null && await helper.getCompanyLogo(undefined) === null && await helper.getCompanyLogo('') === null, 'missing company id -> null (no request made)');
  console.log('\n[2b] a fetch that never answers cannot hang document generation');
  { const t0 = Date.now(); const v = await helper.getCompanyLogo('hang', { timeoutMs: 300 }); const dt = Date.now() - t0;
    ok(v === null && dt >= 250 && dt < 2000, 'stalled logo request -> null after the timeout (' + dt + ' ms), no exception'); }
  { const n0 = calls.length; await helper.getCompanyLogo('hang', { timeoutMs: 100 }); ok(calls.length === n0 + 1, 'a timed-out lookup is NOT cached: the next document asks the server again'); }

  console.log('\n[2c] failures are not cached (a transient error must not hide the logo from later documents)');
  { flakyCalls = 0; const first = await helper.getCompanyLogo('flaky'); const second = await helper.getCompanyLogo('flaky'); const third = await helper.getCompanyLogo('flaky');
    ok(first === null, 'network error on the first attempt -> null');
    ok(second && /PNGDATA/.test(second.dataUrl) && flakyCalls === 2, 'the very next attempt fetches again and gets the logo', 'calls=' + flakyCalls);
    ok(third === second && flakyCalls === 2, 'once loaded, the logo IS cached (no further request)'); }
  { flakyCalls = 0; const first = await helper.getCompanyLogo('flaky404'); const second = await helper.getCompanyLogo('flaky404'); ok(first === null && second && flakyCalls === 2, 'an empty answer (error / not found) is not cached either: the logo appears as soon as it is available'); }
  { const n0 = calls.length; await helper.getCompanyLogo('nologo'); await helper.getCompanyLogo('nologo'); ok(calls.length === n0 + 2, 'company without a logo: re-checked every time (cheap 404), so a newly uploaded logo shows up immediately'); }
  { const n0 = calls.length; const [x, y] = await Promise.all([helper.getCompanyLogo('smallpng'), helper.getCompanyLogo('smallpng')]); ok(calls.length === n0 + 1 && x === y, 'concurrent requests for the same company share one fetch'); }

  console.log('\n[2d] oversized raster logos are downscaled; nothing else changes');
  { canvasLog.length = 0; const v = await helper.getCompanyLogo('bigpng');
    ok(v && v.format === 'PNG' && v.width === 800 && v.height === 400, 'a 4000x2000 PNG becomes 800x400 (aspect ratio kept)', JSON.stringify(v && [v.width, v.height]));
    ok(canvasLog.length === 1 && canvasLog[0].type === 'image/png', 'PNG stays PNG (transparency preserved)', JSON.stringify(canvasLog));
    const box = helper.fitLogo(v, 180, 70), orig = helper.fitLogo({ dataUrl: '', format: 'PNG', width: 4000, height: 2000 }, 180, 70);
    ok(Math.abs(box.width - orig.width) <= 1 && Math.abs(box.height - orig.height) <= 1, 'the size on the page (fitLogo box) is the same as for the full-size image', JSON.stringify([box, orig])); }
  { canvasLog.length = 0; const v = await helper.getCompanyLogo('bigjpg'); ok(v && v.format === 'JPEG' && canvasLog[0] && canvasLog[0].type === 'image/jpeg' && canvasLog[0].q >= 0.9, 'JPEG stays JPEG at high quality (>= 0.9)', JSON.stringify(canvasLog)); }
  { const v = await helper.getCompanyLogo('tallpng'); ok(v && v.height === 800 && v.width === 267, 'a tall logo is limited by its height (1000x3000 -> 267x800)', JSON.stringify(v && [v.width, v.height])); }
  { canvasLog.length = 0; const v = await helper.getCompanyLogo('smallpng'); ok(canvasLog.length === 0 && v.width === 200 && /PNGDATA/.test(v.dataUrl), 'a small logo (200x100) is passed through untouched - never enlarged, never re-encoded'); }
  { helper.clearCompanyLogoCache(); globalThis.__bigOut = true; const v = await helper.getCompanyLogo('bigpng'); globalThis.__bigOut = false; ok(v && v.width === 4000 && /BIGSRC/.test(v.dataUrl), 'if the downscaled image would not be smaller, the original is kept'); }
  { helper.clearCompanyLogoCache(); globalThis.__noCtx = true; const v = await helper.getCompanyLogo('bigpng'); globalThis.__noCtx = false; ok(v && v.width === 4000, 'no canvas support -> original logo used, no failure'); }

  console.log('\n[3] default company for reports without a company filter');
  store['mw-auth-user'] = JSON.stringify({ companyId: A }); ok(helper.getLoggedInCompanyId() === A, 'logged-in user\'s company');
  store['mw-auth-user'] = JSON.stringify({ companyId: '00000000-0000-0000-0000-000000000000' }); ok(helper.getLoggedInCompanyId() === null, 'SuperAdmin\'s system company is not a real company -> no logo');
  store['mw-auth-user'] = '{broken'; ok(helper.getLoggedInCompanyId() === null, 'unreadable storage -> null');
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); fs.unlinkSync(out); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
