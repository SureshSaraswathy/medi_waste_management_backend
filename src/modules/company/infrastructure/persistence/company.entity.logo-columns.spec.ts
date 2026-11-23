import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards against the incident where the company logo columns were dropped by TypeORM synchronize
 * because CompanyEntity did not map them. The entity and migrations/add_logo_support.sql must always
 * describe exactly the same three columns, and the migration must stay additive.
 *
 * This test reads the two files as text on purpose: it does not import TypeORM, because Jest in this
 * project cannot currently load TypeORM (the installed `uuid` package is ESM-only).
 */
describe('CompanyEntity logo columns vs migrations/add_logo_support.sql', () => {
  const root = join(__dirname, '../../../../..'); // backend folder
  const sql = readFileSync(join(root, 'migrations/add_logo_support.sql'), 'utf8');
  const entitySource = readFileSync(join(__dirname, 'company.entity.ts'), 'utf8');

  // SQL statements only (comment lines removed)
  const code = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const migrationColumns = [...code.matchAll(/ALTER TABLE companies ADD COLUMN IF NOT EXISTS\s+(\w+)\s+(\w+)(?:\((\d+)\))?\s+NULL/gi)].map(
    (m) => ({ name: m[1], type: m[2].toLowerCase(), length: m[3] ? Number(m[3]) : undefined }),
  );

  // @Column({ type: 'varchar', length: 500, name: 'logo_path', nullable: true })
  const entityColumns = [...entitySource.matchAll(/@Column\(\{([^}]*name:\s*'(logo_[a-z_]+)'[^}]*)\}\)/g)].map((m) => {
    const body = m[1];
    const type = /type:\s*'(\w+)'/.exec(body);
    const length = /length:\s*(\d+)/.exec(body);
    return {
      name: m[2],
      type: type ? type[1] : undefined,
      length: length ? Number(length[1]) : undefined,
      nullable: /nullable:\s*true/.test(body),
      selectFalse: /select:\s*false/.test(body),
    };
  });

  it('the migration adds exactly the three logo columns', () => {
    expect(migrationColumns.map((c) => c.name).sort()).toEqual(['logo_mime', 'logo_path', 'logo_updated_at']);
  });

  it('the entity maps exactly the same three columns', () => {
    expect(entityColumns.map((c) => c.name).sort()).toEqual(['logo_mime', 'logo_path', 'logo_updated_at']);
  });

  it.each(['logo_path', 'logo_mime', 'logo_updated_at'])('%s has the same type, length and nullability in both', (name) => {
    const m = migrationColumns.find((c) => c.name === name)!;
    const e = entityColumns.find((c) => c.name === name)!;
    expect(m).toBeDefined();
    expect(e).toBeDefined();
    expect(e.type).toBe(m.type);
    expect(e.length).toBe(m.length);
    expect(e.nullable).toBe(true);
    expect(e.selectFalse).toBe(false);
  });

  it('the migration is additive: no statement drops, deletes, updates or rewrites data', () => {
    expect(code).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|INSERT)\b/i);
    expect(code).not.toMatch(/\bALTER\s+COLUMN\b/i);
  });

  it('every statement is repeatable', () => {
    expect(code).toMatch(/CREATE TABLE IF NOT EXISTS app_settings/);
    expect(migrationColumns).toHaveLength(3);
  });

  it('the rollback comment drops only the three company columns and never app_settings', () => {
    const rollback = sql.slice(sql.indexOf('ROLLBACK (manual'));
    const drops = rollback.split('\n').filter((l) => l.trim().startsWith('-- ') && /DROP\s+(TABLE|COLUMN)/i.test(l));
    expect(drops).toHaveLength(3);
    expect(drops.join('\n')).not.toMatch(/app_settings/i);
  });
});
