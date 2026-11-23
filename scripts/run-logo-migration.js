/**
 * Applies migrations/add_logo_support.sql to the MASTER database only.
 *
 * Safety:
 *  - Refuses to run unless you pass --confirm <database-name> and it matches the database the
 *    connection settings point at (so an inherited .env can never aim it at the wrong environment).
 *  - Never creates a database and never touches another database.
 *  - Runs the whole migration in ONE transaction. Before and after, it fingerprints every existing row
 *    of `companies` (ignoring only the three new logo columns) and of `app_settings`. If anything
 *    differs, or any step fails, it ROLLS BACK and exits non-zero.
 *  - --dry-run does everything but ends with ROLLBACK, to rehearse on an environment safely.
 *
 * Usage (from the medi_waste_management_backend folder):
 *   node scripts/run-logo-migration.js --confirm medi_waste_management_master
 *   node scripts/run-logo-migration.js --confirm medi_waste_management_master --dry-run
 *
 * Exit codes: 0 success (or successful dry run), 1 failure (rolled back), 2 refused (bad arguments).
 */
const fs = require('fs');
const path = require('path');

const LOGO_COLUMNS = ['logo_path', 'logo_mime', 'logo_updated_at'];

const COMPANIES_FINGERPRINT_SQL = `
  SELECT count(*)::int AS n,
         md5(coalesce(string_agg(t.j::text, '|' ORDER BY t.id), '')) AS h
    FROM (SELECT company_id::text AS id,
                 (to_jsonb(c) - 'logo_path' - 'logo_mime' - 'logo_updated_at') AS j
            FROM companies c) t`;

const SETTINGS_FINGERPRINT_SQL = `
  SELECT count(*)::int AS n,
         md5(coalesce(string_agg(t.j::text, '|' ORDER BY t.id), '')) AS h
    FROM (SELECT setting_key::text AS id, to_jsonb(s) AS j FROM app_settings s) t`;

function parseArgs(argv) {
  const args = { confirm: null, dryRun: false, sqlFile: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--confirm') args.confirm = argv[(i += 1)] || null;
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--sql') args.sqlFile = argv[(i += 1)] || null;
  }
  return args;
}

/** Row count + content hash of everything that must not change. */
async function fingerprint(client) {
  const companies = (await client.query(COMPANIES_FINGERPRINT_SQL)).rows[0];
  const hasSettings = (await client.query(`SELECT to_regclass('public.app_settings') AS t`)).rows[0].t;
  const settings = hasSettings ? (await client.query(SETTINGS_FINGERPRINT_SQL)).rows[0] : null;
  return {
    companies: { n: companies.n, h: companies.h },
    appSettings: settings ? { n: settings.n, h: settings.h } : null,
  };
}

async function inspectLogoSchema(client) {
  const cols = await client.query(
    `SELECT column_name, data_type, character_maximum_length, is_nullable
       FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = ANY($1) ORDER BY column_name`,
    [LOGO_COLUMNS],
  );
  const settings = (await client.query(`SELECT to_regclass('public.app_settings') AS t`)).rows[0].t;
  return { columns: cols.rows, appSettings: settings };
}

/**
 * Core routine, separated from the CLI so it can be tested against any pg-compatible client.
 * Returns { ok, reason?, before, after, schema, rolledBack }.
 */
async function runMigration({ client, sql, dryRun = false, log = console.log }) {
  const hasCompanies = (await client.query(`SELECT to_regclass('public.companies') AS t`)).rows[0].t;
  if (!hasCompanies) return { ok: false, reason: 'Table "companies" does not exist in this database', rolledBack: false };

  const before = await fingerprint(client);
  log(`Before : companies=${before.companies.n} rows (hash ${before.companies.h}), app_settings=${before.appSettings ? before.appSettings.n + ' rows (hash ' + before.appSettings.h + ')' : 'absent'}`);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    const after = await fingerprint(client);
    const schema = await inspectLogoSchema(client);

    const problems = [];
    if (before.companies.n !== after.companies.n || before.companies.h !== after.companies.h) problems.push('existing company rows changed');
    if (before.appSettings) {
      if (!after.appSettings || before.appSettings.n !== after.appSettings.n || before.appSettings.h !== after.appSettings.h) problems.push('existing app_settings rows changed');
    }
    if (schema.columns.length !== LOGO_COLUMNS.length) problems.push(`expected ${LOGO_COLUMNS.length} logo columns, found ${schema.columns.length}`);
    if (schema.columns.some((c) => c.is_nullable !== 'YES')) problems.push('a logo column is not nullable');
    if (!schema.appSettings) problems.push('app_settings table is missing');

    if (problems.length > 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: problems.join('; '), before, after, schema, rolledBack: true };
    }
    if (dryRun) {
      await client.query('ROLLBACK');
      return { ok: true, dryRun: true, before, after, schema, rolledBack: true };
    }
    await client.query('COMMIT');
    return { ok: true, before, after, schema, rolledBack: false };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* connection may be gone */ }
    return { ok: false, reason: `migration failed and was rolled back: ${err.message}`, rolledBack: true };
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

  if (!args.confirm) {
    console.error(`Refusing to run: pass --confirm ${database} to confirm the target database.`);
    process.exitCode = 2;
    return;
  }
  if (args.confirm !== database) {
    console.error(`Refusing to run: --confirm "${args.confirm}" does not match the target database "${database}".`);
    process.exitCode = 2;
    return;
  }

  const sqlPath = args.sqlFile ? path.resolve(args.sqlFile) : path.join(__dirname, '../migrations/add_logo_support.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client(conn);
  try {
    await client.connect();
    const current = (await client.query('SELECT current_database() AS d')).rows[0].d;
    if (current !== database) throw new Error(`connected to "${current}" but expected "${database}"`);

    const result = await runMigration({ client, sql, dryRun: args.dryRun });
    if (!result.ok) {
      console.error(`FAILED${result.rolledBack ? ' (rolled back, nothing changed)' : ''}: ${result.reason}`);
      process.exitCode = 1;
      return;
    }
    console.log(`After  : companies=${result.after.companies.n} rows (hash ${result.after.companies.h}), app_settings=${result.after.appSettings ? result.after.appSettings.n + ' rows (hash ' + result.after.appSettings.h + ')' : 'absent'}`);
    console.log('Existing company and app_settings rows: unchanged (hashes match).');
    console.log('Logo columns :', result.schema.columns.map((c) => `${c.column_name} ${c.data_type}${c.character_maximum_length ? '(' + c.character_maximum_length + ')' : ''} nullable`).join(', '));
    console.log('app_settings :', result.schema.appSettings);
    console.log(result.dryRun ? '\nDRY RUN OK - everything was rolled back, the database is unchanged.' : '\nDONE - migration applied and committed.');
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigration, fingerprint, parseArgs, LOGO_COLUMNS };
