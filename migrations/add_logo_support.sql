-- Migration: Logo support (Company Logo + Application Logo)
-- Target database : MASTER database (medi_waste_management_master)
--
-- Safety properties
--   * Additive only. Adds 3 nullable columns and creates 1 table if it is missing.
--   * Idempotent: safe to run any number of times (every statement is IF NOT EXISTS).
--   * Does NOT update, delete or rewrite any existing row in `companies` or `app_settings`.
--   * No column default is set, so adding the columns is a catalog-only change (no table rewrite).
--   * Fails fast instead of queueing behind long-running transactions (lock_timeout below).
--
-- ORDER RULE
--   Run this migration BEFORE deploying code in which CompanyEntity maps these columns
--   (company.entity.ts). The previously deployed code ignores the extra columns, so running it
--   first is always safe. Deploying the mapped entity first breaks every query on `companies`.
--
-- HOW TO RUN (not executed automatically; never run by the application):
--   Recommended (transactional, verifies that no existing row changed, can rehearse with --dry-run):
--     node scripts/run-logo-migration.js --confirm <database-name>
--   Alternative:
--     psql -U <user> -d <database> --single-transaction -f migrations/add_logo_support.sql
--
-- ROLLBACK: see the end of this file. It drops ONLY the three company columns.

SET lock_timeout = '5s';
SET statement_timeout = '60s';

-- 1) Company logo reference (the image file lives on disk; only the relative path is stored)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_path       VARCHAR(500) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_mime       VARCHAR(50)  NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_updated_at TIMESTAMP    NULL;

-- 2) Application-level settings (not tied to any company). Holds the Application Logo setting.
--    If the table already exists it is left exactly as it is, including its rows.
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value JSONB        NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_by    UUID         NULL
);

-- Permissions note:
-- Application Branding is restricted to SuperAdmin through a dedicated SuperAdminGuard in the
-- backend, so no permission rows are seeded by this migration.

-- Verification (read-only)
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name IN ('logo_path', 'logo_mime', 'logo_updated_at')
ORDER BY column_name;

SELECT to_regclass('public.app_settings') AS app_settings_table;

-- ---------------------------------------------------------------------------------
-- ROLLBACK (manual, only if required). Drops ONLY the three company columns.
--
--   WARNING: do NOT drop app_settings. It holds the Application Logo setting and may hold
--   other settings. Dropping it would delete them.
--
--   Before rolling back, save the output of `node scripts/reconcile-logos.js` so the company
--   logo references can be re-linked later. The image files on disk are NOT deleted.
--
-- BEGIN;
-- ALTER TABLE companies DROP COLUMN IF EXISTS logo_path;
-- ALTER TABLE companies DROP COLUMN IF EXISTS logo_mime;
-- ALTER TABLE companies DROP COLUMN IF EXISTS logo_updated_at;
-- COMMIT;
-- ---------------------------------------------------------------------------------
