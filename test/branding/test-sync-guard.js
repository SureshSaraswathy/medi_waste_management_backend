// TypeORM synchronize guard: enabled ONLY when NODE_ENV === "development" and the flag === "true", for all four
// connection configs, for the API and the worker (same ConfigModule), plus the PM2 production config and .env.production.example.
// Env: DIST (compiled backend). Plain Node (no database is contacted: only the option objects are inspected).
require('reflect-metadata');
const fs = require('fs'), path = require('path');
const { Test } = require('@nestjs/testing');
const { Logger } = require('@nestjs/common');
const DIST = process.env.DIST;
const root = path.resolve(__dirname, '../..');
const cfgs = require(DIST + '/config/database.config');
let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };

const FLAGS = { masterDatabaseConfig: 'MASTER_DB_SYNCHRONIZE', transactionDatabaseConfig: 'TRANSACTION_DB_SYNCHRONIZE', reportDatabaseConfig: 'REPORT_DB_SYNCHRONIZE', default: 'DB_SYNCHRONIZE' };
const ALL = Object.values(FLAGS);
const setEnv = (nodeEnv, flagValue) => { for (const k of [...ALL, 'NODE_ENV']) delete process.env[k]; if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv; if (flagValue !== undefined) for (const k of ALL) process.env[k] = flagValue; };
const effective = () => Object.fromEntries(Object.entries(FLAGS).map(([name, flag]) => [flag, cfgs[name]().synchronize]));
const quiet = () => { const lines = []; Logger.overrideLogger({ log: (m, c) => lines.push(['log', c, String(m)]), warn: (m, c) => lines.push(['warn', c, String(m)]), error: () => {}, debug: () => {}, verbose: () => {} }); return lines; };

(async () => {
  console.log('[1] full matrix: NODE_ENV x flag value, for all four configurations');
  const lines = quiet();
  const envs = ['development', 'production', 'staging', 'test', 'Production', 'Development', 'DEVELOPMENT', ' development', 'dev', 'local', '', undefined];
  const vals = ['true', 'false', 'TRUE', 'True', '1', 'yes', 'true ', ' true', '', undefined];
  let wrong = [];
  for (const e of envs) for (const v of vals) { setEnv(e, v); const got = effective(); const want = e === 'development' && v === 'true'; for (const [flag, g] of Object.entries(got)) if (g !== want) wrong.push(`${JSON.stringify(e)}/${JSON.stringify(v)}/${flag} -> ${g}`); }
  ok(wrong.length === 0, `${envs.length * vals.length * 4} combinations: synchronize is true ONLY for NODE_ENV="development" + flag="true"`, wrong.slice(0, 4).join('; '));
  for (const e of ['production', 'staging', 'test']) { setEnv(e, 'true'); ok(Object.values(effective()).every((x) => x === false), `NODE_ENV=${e} with ALL FOUR flags "true": still all disabled`); }
  setEnv(undefined, 'true'); ok(Object.values(effective()).every((x) => x === false), 'NODE_ENV not set with all four flags "true": all disabled (a missing NODE_ENV is never "development")');
  setEnv('development', 'true'); ok(Object.values(effective()).every((x) => x === true), 'NODE_ENV=development with the flags "true": enabled (local development keeps working)');
  setEnv('development', 'false'); ok(Object.values(effective()).every((x) => x === false), 'NODE_ENV=development with the flags "false": disabled');
  setEnv('development', undefined); ok(Object.values(effective()).every((x) => x === false), 'NODE_ENV=development with no flag: disabled (opt-in only)');
  setEnv('development'); process.env.MASTER_DB_SYNCHRONIZE = 'true'; const only = effective(); ok(only.MASTER_DB_SYNCHRONIZE === true && !only.TRANSACTION_DB_SYNCHRONIZE && !only.REPORT_DB_SYNCHRONIZE && !only.DB_SYNCHRONIZE, 'each flag controls only its own connection');

  console.log('\n[2] start-up logging of the effective settings');
  lines.length = 0; setEnv('production', 'true'); effective();
  const prod = lines.filter((l) => l[1] === 'DatabaseSync');
  ok(prod.length === 4 && prod.every((l) => l[0] === 'warn' && /synchronize=false/.test(l[2]) && /IGNORED/.test(l[2]) && /NODE_ENV="production"/.test(l[2])), 'production + flag "true": one WARN line per connection saying it is IGNORED and why', JSON.stringify(prod.map((l) => l[2].slice(0, 90))));
  lines.length = 0; setEnv('production', 'false'); effective();
  ok(lines.filter((l) => l[1] === 'DatabaseSync').length === 4 && lines.every((l) => l[0] === 'log' && /synchronize=false/.test(l[2])), 'production + flag "false": one INFO line per connection with the effective value');
  lines.length = 0; setEnv('development', 'true'); effective();
  ok(lines.some((l) => /master: synchronize=true/.test(l[2])) && lines.some((l) => /default: synchronize=true/.test(l[2])), 'development + "true": lines show synchronize=true for each connection name (master/transaction/report/default)');
  Logger.overrideLogger(undefined);

  console.log('\n[3] the worker is protected by the same code');
  const wm = fs.readFileSync(path.join(DIST, 'worker.module.js'), 'utf8');
  ok(/config\/config\.module/.test(wm) && /masterDatabase/.test(wm) && /transactionDatabase/.test(wm), 'WorkerModule imports the shared ConfigModule and reads the masterDatabase / transactionDatabase configs');
  const { ConfigModule } = require(DIST + '/config/config.module');
  const { ConfigService } = require('@nestjs/config');
  quiet();
  for (const [e, v, want] of [['production', 'true', false], ['staging', 'true', false], ['test', 'true', false], ['development', 'true', true]]) {
    setEnv(e, v);
    const m = await Test.createTestingModule({ imports: [ConfigModule] }).compile();
    const cs = m.get(ConfigService);
    const got = ['masterDatabase', 'transactionDatabase', 'reportDatabase', 'database'].map((k) => cs.get(k).synchronize);
    ok(got.every((x) => x === want), `the config the API/worker actually load, NODE_ENV=${e}, flags "true": synchronize=${want} for all four`, JSON.stringify(got));
    await m.close();
  }
  Logger.overrideLogger(undefined);
  const ws = fs.readFileSync(path.join(root, 'src/worker.module.ts'), 'utf8');
  ok(!/synchronize\s*:/.test(ws), 'worker.module.ts does not set synchronize itself (nothing can bypass the shared guard)');
  const bad = []; const constFalse = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(f) && !/\.spec\.ts$/.test(f) && !/database\.config\.ts$/.test(f)) { for (const m of fs.readFileSync(p, 'utf8').matchAll(/^\s*synchronize\s*:\s*([^,\r\n]+)/gm)) (m[1].trim() === 'false' ? constFalse : bad).push(path.relative(root, p).split(path.sep).join('/')); } } }; walk(path.join(root, 'src'));
  ok(bad.length === 0, 'outside database.config.ts nothing sets synchronize to anything but the constant false', bad.join(', '));
  ok(constFalse.length >= 1, `the migration CLI data sources are hard-wired to synchronize:false (${constFalse.length} files)`, constFalse.join(', '));
  const dbSrc = fs.readFileSync(path.join(root, 'src/config/database.config.ts'), 'utf8');
  ok((dbSrc.match(/synchronize:\s*synchronizeFor\(/g) || []).length === 4 && !/synchronize:\s*process\.env/.test(dbSrc), 'all four connection configs go through synchronizeFor(); none reads the flag directly');

  console.log('\n[4] PM2 and the production environment template');
  const eco = require(path.join(root, 'ecosystem.config.js')); const prodEnv = eco.apps[0].env_production;
  ok(ALL.every((k) => prodEnv[k] === 'false') && prodEnv.NODE_ENV === 'production', 'ecosystem.config.js env_production: NODE_ENV=production and all four synchronization flags explicitly "false"', JSON.stringify(prodEnv));
  ok(ALL.every((k) => eco.apps[0].env[k] === undefined || eco.apps[0].env[k] !== 'true'), 'the default PM2 env block does not enable any flag');
  const tpl = fs.readFileSync(path.join(root, '.env.production.example'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  const kv = Object.fromEntries(tpl.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  ok(kv.NODE_ENV === 'production' && ALL.every((k) => kv[k] === 'false'), '.env.production.example: NODE_ENV=production and all four flags "false"');
  ok(!/(PASSWORD|SECRET)=\S/.test(tpl.join('\n')), '.env.production.example contains no secret values');
  ok(/^\.env\.production$/m.test(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')) && !/^\.env\.production\.example$/m.test(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')), 'the real .env.production is git-ignored, the .example file is not');
  // what a production process actually sees: PM2 env_production + whatever a stray .env says
  setEnv(undefined, undefined); Object.assign(process.env, prodEnv, { NODE_ENV: 'production' }); quiet();
  ok(Object.values(effective()).every((x) => x === false), 'with the PM2 production env applied, all four connections have synchronize=false');
  Logger.overrideLogger(undefined);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
