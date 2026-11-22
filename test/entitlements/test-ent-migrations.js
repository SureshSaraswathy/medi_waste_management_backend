const fs = require('fs');
const BE = 'D:/NodeJSProject/medi_waste_management_backend';
const { loadReal, build, adapt } = require('./replica');
const { runAll, FILES } = require(BE + '/scripts/entitlements/run-migrations.js');
const { spawnSync } = require('child_process');

let pass = 0, fail = 0;
const ok = (c, n, x = '') => { c ? pass++ : fail++; console.log(c ? '  PASS' : '  FAIL', n, c ? '' : x); };
const files = (only) => FILES.filter(([id]) => !only || only.includes(id)).map(([id, f]) => [id, fs.readFileSync(`${BE}/migrations/${f}`, 'utf8')]);
const q1 = async (db, sql) => (await db.query(sql)).rows[0];
const hash = async (db, t, pk) => (await q1(db, `SELECT md5(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY x.${pk}),'')) h, count(*)::int n FROM ${t} x`));

(async () => {
  const real = await loadReal();
  console.log(`Replica source: companies=${real.companies.rows.length} users=${real.users.rows.length} roles=${real.roles.rows.length} permissions=${real.permissions.rows.length} role_permissions=${real.role_permissions.rows.length} (test links added when empty)\n`);

  console.log('[1] Full migration on a replica of your data');
  let db = await build(real);
  const pre = { companies: await hash(db, 'companies', 'company_id'), users: await hash(db, 'users', 'user_id'), roles: await hash(db, 'roles', 'role_id'), rp: await hash(db, 'role_permissions', '"rolePermissionId"') };
  const permBefore = await q1(db, `SELECT count(*)::int n FROM permissions`);
  let r = await runAll({ client: adapt(db), files: files(), log: () => {} });
  ok(r.ok && !r.rolledBack, 'all four files apply and commit', r.reason);
  const counts = await q1(db, `SELECT (SELECT count(*) FROM application_modules)::int m,(SELECT count(*) FROM application_submodules)::int s,(SELECT count(*) FROM application_features)::int f,(SELECT count(*) FROM endpoint_feature_map)::int e,(SELECT count(*) FROM company_entitlements)::int ce,(SELECT count(*) FROM company_entitlement_audit)::int au,(SELECT count(*) FROM company_entitlements WHERE is_enabled=false)::int dis`);
  ok(counts.m === 11 && counts.s === 63 && counts.f === 267, `catalogue seeded: ${counts.m} modules, ${counts.s} submodules, ${counts.f} features`);
  ok(counts.e === 345, `endpoint mapping seeded: ${counts.e} rows`);
  const nCompanies = real.companies.rows.filter((c) => !c.is_deleted).length;
  ok(counts.ce === nCompanies * (counts.m + counts.s + counts.f) && counts.dis === 0, `backfill: ${nCompanies} customers x ${counts.m + counts.s + counts.f} items = ${counts.ce} rows, all enabled`);
  ok(counts.au === counts.ce, 'one BACKFILL audit row per inserted row');
  ok(JSON.stringify(await hash(db, 'companies', 'company_id')) === JSON.stringify(pre.companies), 'companies byte-identical');
  ok(JSON.stringify(await hash(db, 'users', 'user_id')) === JSON.stringify(pre.users), 'users byte-identical');
  ok(JSON.stringify(await hash(db, 'roles', 'role_id')) === JSON.stringify(pre.roles), 'roles byte-identical');
  ok(JSON.stringify(await hash(db, 'role_permissions', '"rolePermissionId"')) === JSON.stringify(pre.rp), 'role_permissions byte-identical (existing role permissions unchanged)');
  const permAfter = await q1(db, `SELECT count(*)::int n FROM permissions`);
  ok(permAfter.n - permBefore.n === 59, `59 permission codes added (${permBefore.n} -> ${permAfter.n})`);
  ok((await q1(db, `SELECT count(*)::int n FROM role_permissions rp JOIN permissions p ON p."permissionId"=rp.permission_id WHERE p.permission_code IN ('HOME_VIEW','REPORT_VIEW','DISTRICT_VIEW','INCIDENT_REGISTER_VIEW')`)).n === 0, 'new permission codes are assigned to no role');
  ok((await q1(db, `SELECT count(*)::int n FROM permissions WHERE permission_code IN ('HOME_VIEW','REPORT_VIEW') AND is_active`)).n === 2, 'HOME_VIEW and REPORT_VIEW exist with their original names');
  ok((await q1(db, `SELECT count(*)::int n FROM entitlement_settings WHERE setting_value='OFF'`)).n === 2, 'rollout switches start OFF');

  console.log('\n[2] Mobile App and HCF Portal');
  const mob = await q1(db, `SELECT count(*) FILTER (WHERE entity_code IN ('MOBILE_APP','HCF_PORTAL') AND is_enabled)::int AS on_n, count(DISTINCT company_id) FILTER (WHERE entity_code IN ('MOBILE_APP','HCF_PORTAL'))::int AS cos FROM company_entitlements`);
  ok(mob.on_n === nCompanies * 2, `existing customers are backfilled with Mobile App and HCF Portal enabled (${mob.on_n} rows)`);

  console.log('\n[3] Re-running is safe and never overwrites a customer choice');
  const target = real.companies.rows[0].company_id;
  await db.query(`UPDATE company_entitlements SET is_enabled=false WHERE company_id='${target}' AND entity_code IN ('FINANCE','FINANCE.PAYMENT.RECORD_PAYMENT')`);
  const snap = await hash(db, 'company_entitlements', 'company_id, entity_code');
  r = await runAll({ client: adapt(db), files: files(), log: () => {} });
  ok(r.ok, 'second run succeeds');
  ok(JSON.stringify(await hash(db, 'company_entitlements', 'company_id, entity_code')) === JSON.stringify(snap), 'company_entitlements unchanged, including the two switched-off items');
  ok((await q1(db, `SELECT count(*)::int n FROM company_entitlement_audit`)).n === counts.au, 'no duplicate audit rows');
  ok((await q1(db, `SELECT count(*)::int n FROM permissions`)).n === permAfter.n, 'no duplicate permission rows');

  console.log('\n[4] Dry run');
  db = await build(real);
  r = await runAll({ client: adapt(db), files: files(), dryRun: true, log: () => {} });
  ok(r.ok && r.dryRun, 'dry run reports ok');
  ok(!(await q1(db, `SELECT to_regclass('public.application_modules') t`)).t, 'no entitlement table exists afterwards');
  ok((await q1(db, `SELECT count(*)::int n FROM permissions`)).n === permBefore.n, 'permissions unchanged by the dry run');

  console.log('\n[5] Safety net');
  db = await build(real);
  const bad = files(); bad[3][1] += `\nUPDATE role_permissions SET created_on = now();`;
  r = await runAll({ client: adapt(db), files: bad, log: () => {} });
  ok(!r.ok && r.rolledBack && /role_permissions/.test(r.reason), 'a migration touching role_permissions is detected and rolled back', r.reason);
  ok(!(await q1(db, `SELECT to_regclass('public.company_entitlements') t`)).t && (await q1(db, `SELECT count(*)::int n FROM permissions`)).n === permBefore.n, 'nothing was left behind');
  db = await build(real);
  const bad2 = files(); bad2[3][1] += `\nUPDATE permissions SET permission_name = permission_name || ' x' WHERE permission_code = 'DASHBOARD_VIEW';`;
  r = await runAll({ client: adapt(db), files: bad2, log: () => {} });
  ok(!r.ok && r.rolledBack && /permissions/.test(r.reason), 'a change to an EXISTING permission row is detected and rolled back', r.reason);
  db = await build(real);
  const bad3 = files(); bad3[0][1] += `\nUPDATE companies SET company_name = company_name || ' (changed)';`;
  r = await runAll({ client: adapt(db), files: bad3, log: () => {} });
  ok(!r.ok && r.rolledBack, 'a change to companies is detected and rolled back', r.reason);

  console.log('\n[6] Rollback statements');
  db = await build(real);
  await runAll({ client: adapt(db), files: files(), log: () => {} });
  const sql1 = fs.readFileSync(`${BE}/migrations/entitlements_001_schema.sql`, 'utf8');
  const rb = sql1.split('\n').filter((l) => /^--\s+(BEGIN;|DROP TABLE|COMMIT;)/.test(l)).map((l) => l.replace(/^--\s+/, '')).join('\n');
  const before = { c: await hash(db, 'companies', 'company_id'), p: await hash(db, 'permissions', '"permissionId"') };
  await db.exec(rb);
  ok((await q1(db, `SELECT count(*)::int n FROM information_schema.tables WHERE table_name IN ('application_modules','company_entitlements','endpoint_feature_map','entitlement_settings')`)).n === 0, 'rollback removes the entitlement tables');
  ok(JSON.stringify(await hash(db, 'companies', 'company_id')) === JSON.stringify(before.c) && JSON.stringify(await hash(db, 'permissions', '"permissionId"')) === JSON.stringify(before.p), 'companies and permissions untouched by the rollback');

  console.log('\n[7] Command line refuses without a matching --confirm');
  const run = (a) => spawnSync('node', ['scripts/entitlements/run-migrations.js', ...a], { cwd: BE, encoding: 'utf8' });
  let p = run([]); ok(p.status === 2 && /Refusing to run/.test(p.stderr), 'no --confirm: exit 2');
  p = run(['--confirm', 'wrong_db']); ok(p.status === 2, 'wrong --confirm: exit 2');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
