/**
 * Attributes existing compliance_register rows to the customer that owns them. REPORT FIRST, WRITE ONLY ON REQUEST.
 *
 * Association rule (nothing else is ever guessed):
 *   compliance_register.created_by  ->  users.user_id (master database)  ->  users.company_id
 * Rows whose created_by is empty, unknown, or belongs to a user without a company stay NULL. With tenant isolation
 * in ENFORCE a NULL row is visible to platform administrators only; it is never exposed to a customer.
 * Optional: --assign-unattributed-to <company_id> gives ALL still-unattributed rows to one named customer (use only
 * when you know every legacy row belongs to that customer, e.g. a single-customer installation).
 *
 * Modes
 *   (default / --report)  read-only session: prints the row count and exactly how each row would be associated.
 *                         Works BEFORE migration 006 too (then every row counts as not yet attributed). Add
 *                         --csv <file> to write one line per row (id, created_by, proposed company, status/reason).
 *   --apply --confirm <transaction-db-name>   writes inside ONE transaction, only rows where company_id IS NULL,
 *                         verifies every other column is unchanged (fingerprint) and ROLLS BACK on any difference.
 *   --apply ... --dry-run ends with ROLLBACK.
 *
 * Usage (backend folder):
 *   node scripts/entitlements/backfill-compliance-company.js
 *   node scripts/entitlements/backfill-compliance-company.js --apply --confirm medi_waste_management_transaction --dry-run
 *   node scripts/entitlements/backfill-compliance-company.js --apply --confirm medi_waste_management_transaction
 * Prerequisite: migrations/entitlements_006_compliance_register_company.sql applied to the transaction database.
 * Exit codes: 0 ok, 1 failed (rolled back), 2 refused.
 */
const FP = `SELECT count(*)::int AS n, md5(coalesce(string_agg((to_jsonb(x) - 'company_id')::text, '|' ORDER BY x.id::text), '')) AS h FROM compliance_register x`;

function parseArgs(argv) {
  const a = { apply: false, dryRun: false, confirm: null, assign: null, csv: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--apply') a.apply = true;
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--confirm') a.confirm = argv[(i += 1)] || null;
    else if (argv[i] === '--assign-unattributed-to') a.assign = argv[(i += 1)] || null;
    else if (argv[i] === '--csv') a.csv = argv[(i += 1)] || null;
  }
  return a;
}

/** Builds the plan from two read-only queries. Pure function over plain rows so it can be tested. */
function buildPlan(rows, users, assignTo) {
  const byUser = new Map(users.map((u) => [u.user_id, u.company_id]));
  const plan = { total: rows.length, alreadyOwned: 0, viaCreator: new Map(), unattributed: [], toAssign: [] };
  for (const r of rows) {
    if (r.company_id) { plan.alreadyOwned += 1; continue; }
    const company = r.created_by ? byUser.get(r.created_by) : null;
    if (company) {
      plan.viaCreator.set(company, (plan.viaCreator.get(company) || 0) + 1);
      plan.toAssign.push({ id: r.id, company_id: company, why: 'creator user belongs to this customer' });
    } else if (assignTo) {
      plan.toAssign.push({ id: r.id, company_id: assignTo, why: 'assigned by --assign-unattributed-to' });
    } else {
      plan.unattributed.push({ id: r.id, why: !r.created_by ? 'created_by is empty' : 'creator user not found or has no company' });
    }
  }
  return plan;
}

function printPlan(plan, log) {
  log(`compliance_register rows        : ${plan.total}`);
  log(`  already have a company        : ${plan.alreadyOwned}`);
  log(`  will be attributed            : ${plan.toAssign.length}`);
  for (const [c, n] of plan.viaCreator) log(`      via creator -> company ${c}: ${n}`);
  const extra = plan.toAssign.filter((x) => x.why.startsWith('assigned')).length;
  if (extra) log(`      via --assign-unattributed-to: ${extra}`);
  log(`  stay NULL (platform admin only): ${plan.unattributed.length}`);
  const reasons = {};
  for (const u of plan.unattributed) reasons[u.why] = (reasons[u.why] || 0) + 1;
  for (const [why, n] of Object.entries(reasons)) log(`      ${why}: ${n}`);
}

async function loadInputs(tx, master, hasCompanyColumn = true) {
  const rows = (await tx.query(`SELECT id, created_by, ${hasCompanyColumn ? 'company_id' : 'NULL::uuid AS company_id'} FROM compliance_register WHERE is_deleted = false`)).rows;
  const ids = [...new Set(rows.map((r) => r.created_by).filter(Boolean))];
  const users = ids.length ? (await master.query('SELECT user_id, company_id FROM users WHERE user_id = ANY($1::uuid[])', [ids])).rows : [];
  return { rows, users };
}

/** One line per live row: what would happen to it and why. */
function csvRows(plan) {
  const lines = ['id,proposed_company_id,outcome,reason'];
  for (const a of plan.toAssign) lines.push(`${a.id},${a.company_id},ATTRIBUTABLE,${a.why}`);
  for (const u of plan.unattributed) lines.push(`${u.id},,UNATTRIBUTABLE,${u.why}`);
  return lines;
}
function writeCsv(file, plan) {
  require('fs').writeFileSync(file, csvRows(plan).join(String.fromCharCode(10)) + String.fromCharCode(10));
}

async function applyPlan(tx, plan, dryRun, log) {
  const before = (await tx.query(FP)).rows[0];
  await tx.query('BEGIN');
  try {
    let changed = 0;
    for (const a of plan.toAssign) {
      const r = await tx.query('UPDATE compliance_register SET company_id = $1 WHERE id = $2 AND company_id IS NULL', [a.company_id, a.id]);
      changed += r.rowCount;
    }
    const after = (await tx.query(FP)).rows[0];
    if (before.n !== after.n || before.h !== after.h) { await tx.query('ROLLBACK'); return { ok: false, reason: 'other columns of existing rows changed', rolledBack: true }; }
    if (dryRun) { await tx.query('ROLLBACK'); log(`DRY RUN: ${changed} row(s) would be attributed; rolled back.`); return { ok: true, changed, rolledBack: true }; }
    await tx.query('COMMIT');
    log(`DONE: ${changed} row(s) attributed and committed. Other columns unchanged (hashes match).`);
    return { ok: true, changed, rolledBack: false };
  } catch (err) {
    try { await tx.query('ROLLBACK'); } catch { /* connection may be gone */ }
    return { ok: false, reason: `failed and rolled back: ${err.message}`, rolledBack: true };
  }
}

async function main() {
  require('dotenv').config();
  const { Client } = require('pg');
  const args = parseArgs(process.argv.slice(2));
  const mk = (p, readOnly) => new Client({
    host: process.env[`${p}_DB_HOST`] || 'localhost', port: parseInt(process.env[`${p}_DB_PORT`] || '5432', 10),
    user: process.env[`${p}_DB_USERNAME`], password: process.env[`${p}_DB_PASSWORD`], database: process.env[`${p}_DB_DATABASE`],
    ...(readOnly ? { options: '-c default_transaction_read_only=on' } : {}),
  });
  const txName = process.env.TRANSACTION_DB_DATABASE;
  if (args.apply) {
    if (!args.confirm || args.confirm !== txName) { console.error(`Refusing to write: pass --confirm ${txName} to confirm the target database.`); process.exitCode = 2; return; }
    if (args.assign && !/^[0-9a-f-]{36}$/i.test(args.assign)) { console.error('Refusing: --assign-unattributed-to must be a company uuid.'); process.exitCode = 2; return; }
  }
  const tx = mk('TRANSACTION', !args.apply);
  const master = mk('MASTER', true); // the master database is only ever read
  try {
    await tx.connect(); await master.connect();
    console.log(`Target : ${txName}${args.apply ? (args.dryRun ? ' (apply, DRY RUN)' : ' (APPLY)') : ' (report, read-only)'}`);
    const col = (await tx.query("SELECT 1 FROM information_schema.columns WHERE table_name='compliance_register' AND column_name='company_id'")).rows;
    if (!col.length && args.apply) { console.error('company_id column is missing: apply entitlements_006 first.'); process.exitCode = 2; return; }
    if (!col.length) console.log('(entitlements_006 not applied yet: reporting what a back-fill WOULD do; every row counts as not yet attributed)');
    const { rows, users } = await loadInputs(tx, master, col.length > 0);
    const plan = buildPlan(rows, users, args.assign);
    printPlan(plan, console.log);
    if (args.csv) { writeCsv(args.csv, plan); console.log(`row-level report written to ${args.csv}`); }
    if (!args.apply) { console.log('\nREPORT ONLY - nothing was changed.'); return; }
    const r = await applyPlan(tx, plan, args.dryRun, console.log);
    if (!r.ok) { console.error(`FAILED${r.rolledBack ? ' (rolled back, nothing changed)' : ''}: ${r.reason}`); process.exitCode = 1; }
  } catch (err) {
    console.error('FAILED:', err.message); process.exitCode = 1;
  } finally {
    await tx.end().catch(() => {}); await master.end().catch(() => {});
  }
}

if (require.main === module) main();
module.exports = { buildPlan, printPlan, applyPlan, parseArgs, csvRows };
