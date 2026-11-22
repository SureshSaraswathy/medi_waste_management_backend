-- Customer Entitlements - owner of compliance register rows (TRANSACTION database)
--
-- Adds ONE nullable column so each compliance record can be tied to the customer that owns it (tenant isolation).
-- Existing rows keep NULL ("not attributed yet"): with tenant isolation in ENFORCE they are visible to platform
-- administrators only, until they are attributed with scripts/entitlements/backfill-compliance-company.js.
--
-- Safety properties
--   * Additive only: one nullable column without default (catalog-only change, no table rewrite) and one partial index.
--   * Idempotent (IF NOT EXISTS). Does not update, delete or rewrite any existing row.
--   * Target is the TRANSACTION database (medi_waste_management_transaction), NOT the master database.
--
-- Run:  node scripts/entitlements/run-transaction-migration.js --migration 006 --confirm <transaction-database-name> [--dry-run]
-- Order rule: run BEFORE deploying the backend that maps ComplianceRegisterEntity.companyId.
--
-- ROLLBACK (manual): BEGIN; DROP INDEX IF EXISTS idx_compliance_register_company; ALTER TABLE compliance_register DROP COLUMN IF EXISTS company_id; COMMIT;

SET lock_timeout = '5s';
SET statement_timeout = '60s';

ALTER TABLE compliance_register ADD COLUMN IF NOT EXISTS company_id UUID NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_register_company ON compliance_register (company_id) WHERE is_deleted = false;

-- Verification (read-only)
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_name = 'compliance_register' AND column_name = 'company_id';
