/* Builds an in-memory PostgreSQL (PGlite) replica of the real dev master database tables that the entitlement
 * migrations read: companies, users, roles, role_permissions, permissions. Structure and rows are copied
 * READ-ONLY from the dev database. Nothing is ever written to the real database. */
const BE = 'D:/NodeJSProject/medi_waste_management_backend';
const { PGlite } = require('@electric-sql/pglite');
const { Client } = require(BE + '/node_modules/pg');

const TABLES = [
  ['companies', 'company_id'], ['roles', 'role_id'], ['users', 'user_id'], ['permissions', '"permissionId"'], ['role_permissions', '"rolePermissionId"'],
];

async function loadReal() {
  require(BE + '/node_modules/dotenv').config({ path: BE + '/.env' });
  const c = new Client({ host: 'localhost', port: 5432, user: process.env.MASTER_DB_USERNAME, password: process.env.MASTER_DB_PASSWORD, database: process.env.MASTER_DB_DATABASE, options: '-c default_transaction_read_only=on' });
  await c.connect();
  const out = {};
  for (const [t] of TABLES) {
    const cols = (await c.query(`SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull
        FROM pg_attribute a WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum`, [t])).rows;
    const pk = (await c.query(`SELECT a.attname AS name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary`, [t])).rows.map((r) => r.name);
    const rows = (await c.query(`SELECT coalesce(json_agg(x), '[]'::json) AS j FROM ${t} x`)).rows[0].j;
    out[t] = { cols, pk, rows };
  }
  await c.end();
  return out;
}

async function build(real, { extraRoleLinks = true } = {}) {
  const db = new PGlite();
  for (const [t] of TABLES) {
    const d = real[t];
    const defs = d.cols.map((c) => `"${c.name}" ${c.type}${d.pk.includes(c.name) ? ' PRIMARY KEY' : ''}`);
    await db.exec(`CREATE TABLE ${t} (${defs.join(', ')})`);
    if (d.rows.length) await db.query(`INSERT INTO ${t} SELECT * FROM json_populate_recordset(null::${t}, $1::json)`, [JSON.stringify(d.rows)]);
  }
  // the real dev DB has no role_permissions rows; add some so "existing role permissions unchanged" is a real test
  if (extraRoleLinks && real.role_permissions.rows.length === 0) {
    await db.exec(`INSERT INTO role_permissions ("rolePermissionId", role_id, permission_id, created_on)
                   SELECT gen_random_uuid(), r.role_id, p."permissionId", now() FROM (SELECT role_id FROM roles LIMIT 3) r CROSS JOIN (SELECT "permissionId" FROM permissions LIMIT 6) p`);
  }
  return db;
}

// adapter so scripts written for node-pg can drive PGlite
const adapt = (db) => ({
  async query(text, params) {
    if (params) {
      let t = text;
      const ps = params.map((p, i) => { if (Array.isArray(p)) { t = t.replace(`$${i + 1}`, `$${i + 1}::text[]`); return '{' + p.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(',') + '}'; } return p; });
      return db.query(t, ps);
    }
    const r = await db.exec(text); return r[r.length - 1] || { rows: [] };
  },
});

module.exports = { loadReal, build, adapt };
