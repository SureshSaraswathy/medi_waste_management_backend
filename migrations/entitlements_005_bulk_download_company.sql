-- Customer Entitlements - owner of bulk invoice ZIP download links (TRANSACTION database)
--
-- Adds ONE nullable column so a download link can be re-checked against the customer's entitlement every time
-- it is used. Links created before this column existed have NULL and keep working until their normal expiry.
--
-- Safety properties
--   * Additive only: one nullable column, no default, no index, no data change (catalog-only change).
--   * Idempotent (IF NOT EXISTS). Does not update, delete or rewrite any existing row.
--   * Target is the TRANSACTION database (medi_waste_management_transaction), NOT the master database.
--
-- Run:  node scripts/entitlements/run-transaction-migration.js --confirm <transaction-database-name> [--dry-run]
-- Order rule: run this BEFORE deploying the backend that maps BulkDownloadEntity.companyId (same rule as the
-- logo columns): the previously deployed code ignores an extra column, the new code needs it.
--
-- ROLLBACK (manual): only the one column is dropped.
-- BEGIN;
-- ALTER TABLE "BULK_DOWNLOADS" DROP COLUMN IF EXISTS company_id;
-- COMMIT;

SET lock_timeout = '5s';
SET statement_timeout = '60s';

ALTER TABLE "BULK_DOWNLOADS" ADD COLUMN IF NOT EXISTS company_id UUID NULL;

-- Verification (read-only)
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_name = 'BULK_DOWNLOADS' AND column_name = 'company_id';
