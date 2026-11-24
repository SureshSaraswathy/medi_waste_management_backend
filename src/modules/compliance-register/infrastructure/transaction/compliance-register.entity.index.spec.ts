import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Parity between the entity and migrations/entitlements_006_compliance_register_company.sql.
 *
 * Development runs TypeORM schema synchronization (TRANSACTION_DB_SYNCHRONIZE=true). Synchronization drops every index that
 * the entity does not declare, so an index created by a SQL migration must ALSO be declared on the entity (same name, same
 * column, same partial predicate) or it disappears on the next backend restart.
 *
 * (Reads the source text instead of loading the entity: importing TypeORM under Jest fails in this repository because of an
 * unrelated ESM issue in the `uuid` package.)
 */
describe('ComplianceRegisterEntity - migration-managed index', () => {
  const entitySrc = readFileSync(join(__dirname, 'compliance-register.entity.ts'), 'utf8');
  const sql = readFileSync(join(__dirname, '../../../../../migrations/entitlements_006_compliance_register_company.sql'), 'utf8');

  const migration = /CREATE INDEX IF NOT EXISTS (\w+) ON compliance_register \((\w+)\) WHERE ([^;]+);/.exec(sql);

  it('migration 006 creates the index as a partial index on company_id', () => {
    expect(migration).not.toBeNull();
    const [, name, column, predicate] = migration as RegExpExecArray;
    expect(name).toBe('idx_compliance_register_company');
    expect(column).toBe('company_id');
    expect(predicate.trim()).toBe('is_deleted = false');
  });

  it('the entity declares the same index: same name, column (company_id) and predicate', () => {
    const [, name, , predicate] = migration as RegExpExecArray;
    const decl = new RegExp(`@Index\\('${name}', \\['companyId'\\], \\{ where: '${predicate.trim()}' \\}\\)`);
    expect(entitySrc).toMatch(decl);
  });

  it('companyId is mapped to the migration-added nullable uuid column company_id', () => {
    expect(entitySrc).toMatch(/@Column\(\{ type: 'uuid', name: 'company_id', nullable: true \}\)\s+companyId\?: string \| null;/);
  });

  it('no other entity index uses the migration-managed name (no duplicates)', () => {
    expect(entitySrc.match(/idx_compliance_register_company/g)?.length).toBeGreaterThanOrEqual(1);
    expect((entitySrc.match(/@Index\('idx_compliance_register_company'/g) || []).length).toBe(1);
  });
});
