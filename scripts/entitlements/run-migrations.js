/**
 * Applies the Customer Entitlements migrations to the MASTER database, in order, in ONE transaction:
 *   entitlements_001_schema.sql, 002_catalogue_seed.sql, 003_backfill.sql, 004_permission_codes.sql
 *
 * Safety:
 *  - Refuses to run unless you pass --confirm <database-name> and it matches the target database.
 *  - Before and after, it fingerprints companies, users, roles, role_permissions and the EXISTING rows of
 *    permissions. If any of them differ, or the backfill counts are wrong, it ROLLS BACK and exits 1.
 *  - Never touches another database, never creates a database.
 *  - --dry-run does everything and ends with ROLLBACK.
 *
 * Usage (backend folder):
 *   node scripts/entitlements/run-migrations.js --confirm medi_waste_management_master --dry-run
 *   node scripts/entitlements/run-migrations.js --confirm medi_waste_management_master
 *   node scripts/entitlements/run-migrations.js --confirm <db> --only 001,002     (subset)
 *
 * Exit codes: 0 ok, 1 failed (rolled back), 2 refused (bad arguments).
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  ['001', 'entitlements_001_schema.sql'],
  ['002', 'entitlements_002_catalogue_seed.sql'],
  ['003', 'entitlements_003_backfill.sql'],
  ['004', 'entitlements_004_permission_codes.sql'],
];

// tables that must be unchanged. `grow` = new rows allowed (existing rows must stay identical).
const PROTECTED = [
  { table: 'companies', pk: 'company_id' },
  { table: 'users', pk: 'user_id' },
  { table: 'roles', pk: 'role_id' },
  { table: 'role_permissions', pk: '"rolePermissionId"' },
  { table: 'permissions', pk: '"permissionId"', grow: true },
];

const fpSql = (t, ids) => `SELECT count(*)::int AS n, md5(coalesce(string_agg(to_jsonb(x)::text, '|' ORDER BY x.${t.pk}), '')) AS h FROM ${t.table} x${ids ? ` WHERE x.${t.pk}::text = ANY($1)` : ''}`;

async function fingerprints(client, before) {
  const out = {};
  for (const t of PROTECTED) {
    const exists = (await client.query(`SELECT to_regclass('public.${t.table}') AS r`)).rows[0].r;
    if (!exists) { out[t.table] = null; continue; }
    if (before && t.grow) {
      out[t.table] = (await client.query(fpSql(t, true), [before[t.table].ids])).rows[0];
      out[t.table].total = (await client.query(`SELECT count(*)::int AS n FROM ${t.table}`)).rows[0].n;
    } else {
      out[t.table] = (await client.query(fpSql(t, false))).rows[0];
      if (t.grow) out[t.table].ids = (await client.query(`SELECT ${t.pk}::text AS id FROM ${t.table}`)).rows.map((r) => r.id);
    }
  }
  return out;
}

function parseArgs(argv) {
  const a = { confirm: null, dryRun: false, only: null, dir: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--confirm') a.confirm = argv[(i += 1)] || null;
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--only') a.only = (argv[(i += 1)] || '').split(',').filter(Boolean);
    else if (argv[i] === '--dir') a.dir = argv[(i += 1)];
  }
  return a;
}

/** Core routine (testable with any pg-compatible client). */
async function runAll({ client, files, dryRun = false, log = console.log }) {
  const before = await fingerprints(client, null);
  const hasCe = (await client.query(`SELECT to_regclass('public.company_entitlements') AS r`)).rows[0].r;
  const disabledBefore = hasCe ? (await client.query(`SELECT count(*)::int AS n FROM company_entitlements WHERE is_enabled = FALSE`)).rows[0].n : 0;
  log('Before : ' + PROTECTED.map((t) => `${t.table}=${before[t.table] ? before[t.table].n : 'absent'}`).join(', '));

  await client.query('BEGIN');
  try {
    for (const [id, sql] of files) {
      await client.query(sql);
      log(`  applied ${id}`);
    }
    const after = await fingerprints(client, before);
    const problems = [];
    for (const t of PROTECTED) {
      if (!before[t.table]) continue;
      const b = before[t.table]; const a = after[t.table];
      if (!a || a.n !== b.n || a.h !== b.h) problems.push(`${t.table}: existing rows changed`);
    }
    const ran = files.map((f) => f[0]);
    if (ran.includes('003')) {
      const c = (await client.query(`SELECT (SELECT count(*) FROM companies WHERE is_deleted = FALSE)::int AS cos,
        ((SELECT count(*) FROM application_modules WHERE status='Active') + (SELECT count(*) FROM application_submodules WHERE status='Active') + (SELECT count(*) FROM application_features WHERE status='Active'))::int AS nodes,
        (SELECT count(*) FROM company_entitlements)::int AS rows,
        (SELECT count(*) FROM company_entitlements WHERE is_enabled = FALSE)::int AS disabled`)).rows[0];
      if (c.rows < c.cos * c.nodes) problems.push(`backfill incomplete: ${c.rows} rows for ${c.cos} companies x ${c.nodes} nodes`);
      // a customer may legitimately have items switched off; the run itself must not create any
      if (c.disabled > disabledBefore) problems.push(`backfill created ${c.disabled - disabledBefore} disabled rows (expected 0)`);
    }
    if (ran.includes('004')) {
      const t = after.permissions;
      if (t.total - before.permissions.n > 59) problems.push('more than 59 permission rows were added');
    }
    if (problems.length) { await client.query('ROLLBACK'); return { ok: false, reason: problems.join('; '), before, after, rolledBack: true }; }
    if (dryRun) { await client.query('ROLLBACK'); return { ok: true, dryRun: true, before, after, rolledBack: true }; }
    await client.query('COMMIT');
    return { ok: true, before, after, rolledBack: false };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* connection may be gone */ }
    return { ok: false, reason: `failed and rolled back: ${err.message}`, rolledBack: true };
  }
}

async function main() {
  require('dotenv').config();
  const { Client } = require('pg');
  const args = parseArgs(process.argv.slice(2));
  const database = process.env.MASTER_DB_DATABASE || 'medi_waste_management_master';
  const conn = {
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database,
  };
  console.log(`Target : ${conn.user}@${conn.host}:${conn.port}/${conn.database}${args.dryRun ? '  (DRY RUN: will roll back)' : ''}`);
  if (!args.confirm) { console.error(`Refusing to run: pass --confirm ${database} to confirm the target database.`); process.exitCode = 2; return; }
  if (args.confirm !== database) { console.error(`Refusing to run: --confirm "${args.confirm}" does not match the target database "${database}".`); process.exitCode = 2; return; }

  const dir = args.dir ? path.resolve(args.dir) : path.join(__dirname, '../../migrations');
  const files = FILES.filter(([id]) => !args.only || args.only.includes(id)).map(([id, f]) => [id, fs.readFileSync(path.join(dir, f), 'utf8')]);
  const client = new Client(conn);
  try {
    await client.connect();
    const current = (await client.query('SELECT current_database() AS d')).rows[0].d;
    if (current !== database) throw new Error(`connected to "${current}" but expected "${database}"`);
    const r = await runAll({ client, files, dryRun: args.dryRun });
    if (!r.ok) { console.error(`FAILED${r.rolledBack ? ' (rolled back, nothing changed)' : ''}: ${r.reason}`); process.exitCode = 1; return; }
    console.log('After  : ' + PROTECTED.map((t) => `${t.table}=${r.after[t.table] ? (t.grow ? r.after[t.table].total + ' (existing rows identical)' : r.after[t.table].n) : 'absent'}`).join(', '));
    console.log('Existing companies, users, roles, role_permissions and permission rows: unchanged (hashes match).');
    console.log(r.dryRun ? '\nDRY RUN OK - everything was rolled back, the database is unchanged.' : '\nDONE - entitlement migrations applied and committed.');
  } catch (err) {
    console.error('FAILED:', err.message); process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) main();
module.exports = { runAll, fingerprints, parseArgs, FILES, PROTECTED };
