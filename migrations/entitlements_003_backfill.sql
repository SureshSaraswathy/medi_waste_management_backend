-- Customer Entitlements - backfill (MASTER database)
--
-- Gives EVERY existing, non-deleted customer everything the application offers today, so nobody loses access
-- when enforcement is later switched on. Per the approved decisions this includes Mobile App and HCF Portal
-- for existing customers. Customers created AFTER this runs get no rows, which means: core items only.
--
-- Safety properties
--   * Inserts rows only; ON CONFLICT DO NOTHING, so a customer's existing choices are never overwritten.
--   * Idempotent: running it again inserts nothing (new catalogue items added in a later release are NOT
--     backfilled by re-running it unless you intend that: it enables every catalogue item that has no row).
--   * Writes one audit row (action BACKFILL) for every row it inserts.
--   * Touches no existing table other than reading companies and the catalogue.
--
-- Run after entitlements_002_catalogue_seed.sql.
--
-- ROLLBACK (manual): DELETE FROM company_entitlements WHERE updated_by IS NULL AND entity_code IN (...)
--   or, to undo only this backfill, use the audit rows:
--   DELETE FROM company_entitlements ce USING company_entitlement_audit a
--    WHERE a.action = 'BACKFILL' AND a.company_id = ce.company_id AND a.entity_code = ce.entity_code;

SET lock_timeout = '5s';

WITH nodes AS (
    SELECT 'MODULE'::varchar AS entity_type, module_code AS entity_code FROM application_modules WHERE status = 'Active'
    UNION ALL
    SELECT 'SUBMODULE', submodule_code FROM application_submodules WHERE status = 'Active'
    UNION ALL
    SELECT 'FEATURE', feature_code FROM application_features WHERE status = 'Active'
), batch AS (
    SELECT gen_random_uuid() AS batch_id
), inserted AS (
    INSERT INTO company_entitlements (company_id, entity_type, entity_code, is_enabled, updated_by)
    SELECT c.company_id, n.entity_type, n.entity_code, TRUE, NULL
      FROM companies c CROSS JOIN nodes n
     WHERE c.is_deleted = FALSE
    ON CONFLICT (company_id, entity_code) DO NOTHING
    RETURNING company_id, entity_code
)
INSERT INTO company_entitlement_audit (batch_id, company_id, entity_code, old_value, new_value, action, changed_by, changed_by_name, reason)
SELECT b.batch_id, i.company_id, i.entity_code, NULL, TRUE, 'BACKFILL', NULL, 'migration', 'Initial backfill: existing customers keep everything they have today'
  FROM inserted i CROSS JOIN batch b;

-- Verification (read-only): each active customer should have one row per catalogue node
SELECT (SELECT count(*) FROM companies WHERE is_deleted = FALSE) AS active_companies,
       (SELECT count(*) FROM application_modules WHERE status = 'Active')
     + (SELECT count(*) FROM application_submodules WHERE status = 'Active')
     + (SELECT count(*) FROM application_features WHERE status = 'Active') AS catalogue_nodes,
       (SELECT count(*) FROM company_entitlements) AS entitlement_rows;
