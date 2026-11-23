/**
 * READ-ONLY logo reconciliation.
 *
 * Compares the logo files on disk (UPLOAD_DIR/companies/<companyId>/logo-*.*, UPLOAD_DIR/branding/*)
 * with what the master database references, and reports which files can be recovered.
 *
 * It NEVER writes: the session is forced read-only, and the statements it prints are for you to
 * review and run yourself (or not). Run it before any rollback and after any suspected column loss.
 *
 * Usage (from the medi_waste_management_backend folder):
 *   node scripts/reconcile-logos.js
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_RE = /^logo-[0-9a-f]{12}\.(png|jpg|svg)$/i;
const MIME = { png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml' };

const uploadRoot = () => {
  const configured = process.env.UPLOAD_DIR || './storage/uploads';
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
};

/** True when the file's first bytes match its extension (the same rule the upload validator enforces). */
function looksValid(file, ext) {
  try {
    const buf = fs.readFileSync(file);
    if (ext === 'png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (ext === 'jpg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (ext === 'svg') return buf.subarray(0, 2048).toString('utf8').toLowerCase().includes('<svg');
  } catch { /* unreadable */ }
  return false;
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

async function main() {
  const root = uploadRoot();
  console.log(`Upload root : ${root}`);
  const client = new Client({
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.MASTER_DB_DATABASE || 'medi_waste_management_master',
    options: '-c default_transaction_read_only=on', // belt and braces: this session cannot write
  });
  await client.connect();
  console.log(`Database    : ${client.database || process.env.MASTER_DB_DATABASE || 'medi_waste_management_master'} (read-only session)\n`);

  const logoCols = (await client.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name IN ('logo_path','logo_mime','logo_updated_at')`,
  )).rows.map((r) => r.column_name);
  const columnsPresent = logoCols.length === 3;
  console.log(`Logo columns on companies: ${columnsPresent ? 'present' : `MISSING (${3 - logoCols.length} of 3 absent). Run the migration before re-linking.`}`);

  const companies = (await client.query(
    columnsPresent
      ? `SELECT company_id, company_code, company_name, is_deleted, logo_path FROM companies ORDER BY company_code`
      : `SELECT company_id, company_code, company_name, is_deleted, NULL::text AS logo_path FROM companies ORDER BY company_code`,
  )).rows;
  const byId = new Map(companies.map((c) => [c.company_id, c]));

  // ---- company logos on disk
  const rows = [];
  const statements = [];
  const companiesDir = path.join(root, 'companies');
  const dirs = fs.existsSync(companiesDir) ? fs.readdirSync(companiesDir).filter((d) => UUID_RE.test(d)) : [];
  for (const id of dirs) {
    const dir = path.join(companiesDir, id);
    const files = fs.readdirSync(dir).filter((f) => FILE_RE.test(f)).map((f) => {
      const full = path.join(dir, f);
      const ext = f.split('.').pop().toLowerCase();
      return { name: f, rel: `companies/${id}/${f}`, ext, mtime: fs.statSync(full).mtimeMs, size: fs.statSync(full).size, valid: looksValid(full, ext) };
    }).sort((a, b) => b.mtime - a.mtime);
    const company = byId.get(id);
    const label = company ? `${company.company_code} (${company.company_name})` : '(no such company)';

    if (files.length === 0) { rows.push([id, label, '-', 'EMPTY_FOLDER']); continue; }
    // newest file that passes the content check; if none passes, show the newest and flag it
    const newest = files.find((f) => f.valid) || files[0];
    let status;
    if (!company) status = 'ORPHAN_NO_COMPANY';
    else if (company.is_deleted) status = 'COMPANY_DELETED';
    else if (columnsPresent && company.logo_path && files.some((f) => f.rel === company.logo_path)) status = 'REFERENCED_OK';
    else if (columnsPresent && company.logo_path) status = 'REFERENCE_POINTS_TO_OTHER_FILE';
    else status = columnsPresent ? 'RECOVERABLE (no database reference)' : 'RECOVERABLE (columns missing)';
    if (!newest.valid) status += ' + FILE_FAILS_CONTENT_CHECK';
    rows.push([id, label, `${newest.rel} (${newest.size} bytes)`, status + (files.length > 1 ? ` [${files.length} files, newest shown]` : '')]);

    if (status.startsWith('RECOVERABLE') && newest.valid) {
      statements.push(
        `UPDATE companies SET logo_path = ${q(newest.rel)}, logo_mime = ${q(MIME[newest.ext])}, logo_updated_at = NOW()\n` +
        `  WHERE company_id = ${q(id)} AND logo_path IS NULL AND is_deleted = false;  -- ${label}`,
      );
    }
  }
  // companies referencing a missing file
  if (columnsPresent) {
    for (const c of companies) {
      if (c.logo_path && !fs.existsSync(path.join(root, c.logo_path))) rows.push([c.company_id, `${c.company_code}`, c.logo_path, 'REFERENCE_FILE_MISSING_ON_DISK']);
    }
  }

  console.log('\nCOMPANY LOGOS');
  if (rows.length === 0) console.log('  (no company logo folders on disk)');
  for (const r of rows) console.log(`  ${r[1]}\n    folder : ${r[0]}\n    file   : ${r[2]}\n    status : ${r[3]}`);

  // ---- application logo
  console.log('\nAPPLICATION LOGO');
  const hasSettings = (await client.query(`SELECT to_regclass('public.app_settings') AS t`)).rows[0].t;
  let appRef = null;
  if (hasSettings) {
    const r = await client.query(`SELECT setting_value FROM app_settings WHERE setting_key = 'application_logo'`);
    appRef = r.rows[0] && r.rows[0].setting_value ? r.rows[0].setting_value : null;
  }
  const brandingDir = path.join(root, 'branding');
  const brandingFiles = fs.existsSync(brandingDir) ? fs.readdirSync(brandingDir) : [];
  if (!hasSettings) console.log('  app_settings table: MISSING');
  else if (!appRef) console.log(`  no application_logo setting. Files on disk: ${brandingFiles.join(', ') || 'none'}`);
  else console.log(`  setting -> ${appRef.path}   file on disk: ${fs.existsSync(path.join(root, appRef.path)) ? 'YES' : 'NO (reference is broken)'}`);

  console.log('\nPROPOSED RE-LINK STATEMENTS (NOT executed; review each before running anything)');
  if (statements.length === 0) console.log('  none needed');
  statements.forEach((s) => console.log('  ' + s.replace(/\n/g, '\n  ')));
  console.log(`\nSummary: ${dirs.length} company folder(s) on disk, ${statements.length} recoverable, ${rows.filter((r) => /REFERENCED_OK/.test(r[3])).length} already referenced.`);
  await client.end();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exitCode = 1; });
