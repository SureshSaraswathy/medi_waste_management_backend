/**
 * Applies a TRANSACTION-database entitlement migration (005 bulk download owner, 006 compliance register owner).
 *
 * Safety: refuses to run without --confirm <database-name> matching the target; runs in one transaction;
 * fingerprints every existing row of "BULK_DOWNLOADS" (ignoring only the new column) before and after and
 * ROLLS BACK if anything differs; --dry-run ends with ROLLBACK.
 *
 * Usage (backend folder):
 *   node scripts/entitlements/run-transaction-migration.js [--migration 005|006] --confirm medi_waste_management_transaction --dry-run
 *   node scripts/entitlements/run-transaction-migration.js --confirm medi_waste_management_transaction
 * Exit codes: 0 ok, 1 failed (rolled back), 2 refused.
 */
const fs = require('fs');
const path = require('path');

// migrations that belong to the TRANSACTION database: file, table whose existing rows must stay untouched
const MIGRATIONS = {
  '005': { file: 'entitlements_005_bulk_download_company.sql', table: 'BULK_DOWNLOADS' },
  '006': { file: 'entitlements_006_compliance_register_company.sql', table: 'compliance_register' },
};
const fingerprint = (table) => `SELECT count(*)::int AS n, md5(coalesce(string_agg((to_jsonb(x) - 'company_id')::text, '|' ORDER BY x.id::text), '')) AS h FROM "${table}" x`;

function parseArgs(argv) {
  const a = { confirm: null, dryRun: false, migration: '005' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--confirm') a.confirm = argv[(i += 1)] || null;
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--migration') a.migration = argv[(i += 1)] || '';
  }
  return a;
}

async function runOne({ client, sql, dryRun = false, log = console.log, table = 'BULK_DOWNLOADS' }) {
  const FP = fingerprint(table);
  const exists = (await client.query(`SELECT to_regclass('public."${table}"') AS r`)).rows[0].r;
  if (!exists) return { ok: false, reason: `Table "${table}" does not exist in this database`, rolledBack: false };
  const before = (await client.query(FP)).rows[0];
  log(`Before : ${table}=${before.n} rows (hash ${before.h})`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    const after = (await client.query(FP)).rows[0];
    const col = (await client.query(`SELECT is_nullable FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'company_id'`)).rows;
    const problems = [];
    if (before.n !== after.n || before.h !== after.h) problems.push(`existing ${table} rows changed`);
    if (col.length !== 1 || col[0].is_nullable !== 'YES') problems.push('company_id column missing or not nullable');
    if (problems.length) { await client.query('ROLLBACK'); return { ok: false, reason: problems.join('; '), rolledBack: true }; }
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
  const database = process.env.TRANSACTION_DB_DATABASE || 'medi_waste_management_transaction';
  const conn = {
    host: process.env.TRANSACTION_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TRANSACTION_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.TRANSACTION_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.TRANSACTION_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database,
  };
  console.log(`Target : ${conn.user}@${conn.host}:${conn.port}/${conn.database}${args.dryRun ? '  (DRY RUN: will roll back)' : ''}`);
  if (!args.confirm) { console.error(`Refusing to run: pass --confirm ${database} to confirm the target database.`); process.exitCode = 2; return; }
  if (args.confirm !== database) { console.error(`Refusing to run: --confirm "${args.confirm}" does not match the target database "${database}".`); process.exitCode = 2; return; }
  const mig = MIGRATIONS[args.migration];
  if (!mig) { console.error(`Refusing to run: unknown --migration "${args.migration}" (use 005 or 006).`); process.exitCode = 2; return; }
  const sql = fs.readFileSync(path.join(__dirname, '../../migrations', mig.file), 'utf8');
  const client = new Client(conn);
  try {
    await client.connect();
    const current = (await client.query('SELECT current_database() AS d')).rows[0].d;
    if (current !== database) throw new Error(`connected to "${current}" but expected "${database}"`);
    const r = await runOne({ client, sql, dryRun: args.dryRun, table: mig.table });
    if (!r.ok) { console.error(`FAILED${r.rolledBack ? ' (rolled back, nothing changed)' : ''}: ${r.reason}`); process.exitCode = 1; return; }
    console.log(`After  : ${mig.table}=${r.after.n} rows (hash ${r.after.h})`);
    console.log('Existing rows: unchanged (hashes match).');
    console.log(r.dryRun ? '\nDRY RUN OK - everything was rolled back, the database is unchanged.' : '\nDONE - migration applied and committed.');
  } catch (err) {
    console.error('FAILED:', err.message); process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) main();
module.exports = { runOne, parseArgs };
