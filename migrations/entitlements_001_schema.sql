-- Customer Entitlements - schema (MASTER database)
--
-- Safety properties
--   * Additive only: creates 9 new tables. It does not alter, update or delete anything that exists.
--   * Idempotent: every statement is IF NOT EXISTS.
--   * Timestamps are TIMESTAMPTZ so they mean the same instant whatever the database or server time zone is.
--   * No existing table is referenced except `companies(company_id)` (foreign key from company_entitlements).
--   * These tables are accessed with plain SQL by the backend and are NOT mapped as TypeORM entities, so
--     TypeORM `synchronize` can never drop or alter them (same as the existing app_settings table).
--
-- Run order: entitlements_001_schema.sql, 002_catalogue_seed.sql, 003_backfill.sql, 004_permission_codes.sql
-- Use:  node scripts/entitlements/run-migrations.js --confirm <database-name> [--dry-run]
-- Rollback: see the end of this file (drops only these 9 tables).

SET lock_timeout = '5s';
SET statement_timeout = '120s';

-- Catalogue -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_modules (
    module_id     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code   VARCHAR(50)  NOT NULL UNIQUE,
    module_name   VARCHAR(150) NOT NULL,
    description   TEXT         NULL,
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_core       BOOLEAN      NOT NULL DEFAULT FALSE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Active',
    introduced_in VARCHAR(20)  NULL,
    created_on    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_submodules (
    submodule_id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id      UUID         NOT NULL REFERENCES application_modules(module_id),
    submodule_code VARCHAR(100) NOT NULL UNIQUE,
    submodule_name VARCHAR(150) NOT NULL,
    route_prefix   VARCHAR(500) NULL,
    sort_order     INTEGER      NOT NULL DEFAULT 0,
    is_core        BOOLEAN      NOT NULL DEFAULT FALSE,
    status         VARCHAR(20)  NOT NULL DEFAULT 'Active',
    introduced_in  VARCHAR(20)  NULL,
    created_on     TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_submodules_module ON application_submodules(module_id);

CREATE TABLE IF NOT EXISTS application_features (
    feature_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    submodule_id    UUID         NOT NULL REFERENCES application_submodules(submodule_id),
    feature_code    VARCHAR(150) NOT NULL UNIQUE,
    feature_name    VARCHAR(150) NOT NULL,
    feature_type    VARCHAR(20)  NOT NULL DEFAULT 'ACTION',
    enforcement     VARCHAR(10)  NOT NULL DEFAULT 'API',
    permission_code VARCHAR(100) NULL,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    status          VARCHAR(20)  NOT NULL DEFAULT 'Active',
    introduced_in   VARCHAR(20)  NULL,
    created_on      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_features_submodule ON application_features(submodule_id);

-- Explicit, auditable endpoint -> feature mapping. feature_code holds one code, or several separated by '|'
-- meaning ANY-OF (entitled if any listed item is enabled). A NULL feature_code is an EXEMPT row.
CREATE TABLE IF NOT EXISTS endpoint_feature_map (
    map_id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    http_method       VARCHAR(10)  NOT NULL,
    route_pattern     VARCHAR(300) NOT NULL,
    feature_code      VARCHAR(700) NULL,
    exempt_reason     VARCHAR(300) NULL,
    mapping_source    VARCHAR(10)  NOT NULL,
    controller        VARCHAR(100) NULL,
    permission_code   VARCHAR(100) NULL,
    tenant_mode       VARCHAR(20)  NULL,
    tenant_db         VARCHAR(20)  NULL,
    tenant_table      VARCHAR(100) NULL,
    tenant_pk         VARCHAR(100) NULL,
    tenant_param      VARCHAR(60)  NULL,
    tenant_via_sql    TEXT         NULL,
    body_has_company  BOOLEAN      NOT NULL DEFAULT FALSE,
    query_has_company BOOLEAN      NOT NULL DEFAULT FALSE,
    deprecated        BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_endpoint_feature_map UNIQUE (http_method, route_pattern)
);

-- Customer configuration --------------------------------------------------------------------------
-- One row per company and catalogue node. A missing row means DISABLED. Rows are never deleted by the
-- application: switching something off only sets is_enabled = FALSE, so earlier choices are remembered.
CREATE TABLE IF NOT EXISTS company_entitlements (
    company_id  UUID         NOT NULL REFERENCES companies(company_id),
    entity_type VARCHAR(10)  NOT NULL CHECK (entity_type IN ('MODULE', 'SUBMODULE', 'FEATURE')),
    entity_code VARCHAR(150) NOT NULL,
    is_enabled  BOOLEAN      NOT NULL,
    updated_by  UUID         NULL,
    updated_on  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (company_id, entity_code)
);

CREATE TABLE IF NOT EXISTS company_entitlement_audit (
    audit_id        BIGSERIAL    PRIMARY KEY,
    batch_id        UUID         NOT NULL,
    company_id      UUID         NOT NULL,
    entity_code     VARCHAR(150) NOT NULL,
    old_value       BOOLEAN      NULL,
    new_value       BOOLEAN      NOT NULL,
    action          VARCHAR(10)  NOT NULL CHECK (action IN ('SET', 'BACKFILL', 'COPY')),
    changed_by      UUID         NULL,
    changed_by_name VARCHAR(200) NULL,
    changed_on      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reason          TEXT         NULL
);
CREATE INDEX IF NOT EXISTS idx_entitlement_audit_company ON company_entitlement_audit(company_id, changed_on DESC);
CREATE INDEX IF NOT EXISTS idx_entitlement_audit_batch ON company_entitlement_audit(batch_id);

-- Rollout ------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entitlement_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(100) NOT NULL,
    updated_by    UUID         NULL,
    updated_on    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Would-be blocks recorded in SHADOW mode, aggregated per day so the table cannot grow without bound.
CREATE TABLE IF NOT EXISTS entitlement_shadow_log (
    log_id         BIGSERIAL    PRIMARY KEY,
    day            DATE         NOT NULL,
    company_id     UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    http_method    VARCHAR(10)  NOT NULL,
    route_pattern  VARCHAR(300) NOT NULL,
    reason         VARCHAR(30)  NOT NULL,
    hit_count      BIGINT       NOT NULL DEFAULT 0,
    first_seen     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sample_user_id VARCHAR(100) NULL,
    detail         VARCHAR(300) NULL,
    CONSTRAINT uq_entitlement_shadow UNIQUE (day, company_id, http_method, route_pattern, reason)
);

-- Requests seen per mapped route per day (lets the shadow report show which endpoints were never exercised).
CREATE TABLE IF NOT EXISTS entitlement_coverage_daily (
    day           DATE         NOT NULL,
    http_method   VARCHAR(10)  NOT NULL,
    route_pattern VARCHAR(300) NOT NULL,
    hit_count     BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (day, http_method, route_pattern)
);

-- Verification (read-only)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
  'application_modules','application_submodules','application_features','endpoint_feature_map',
  'company_entitlements','company_entitlement_audit','entitlement_settings','entitlement_shadow_log','entitlement_coverage_daily')
ORDER BY table_name;

-- ---------------------------------------------------------------------------------------------------
-- ROLLBACK (manual, only if required). Drops ONLY the 9 tables created here. No other object is touched.
-- WARNING: this deletes the customer entitlement configuration and its audit history. Export them first:
--   node scripts/entitlements/export-config.js   (if you need to keep them)
--
-- BEGIN;
-- DROP TABLE IF EXISTS entitlement_coverage_daily;
-- DROP TABLE IF EXISTS entitlement_shadow_log;
-- DROP TABLE IF EXISTS entitlement_settings;
-- DROP TABLE IF EXISTS company_entitlement_audit;
-- DROP TABLE IF EXISTS company_entitlements;
-- DROP TABLE IF EXISTS endpoint_feature_map;
-- DROP TABLE IF EXISTS application_features;
-- DROP TABLE IF EXISTS application_submodules;
-- DROP TABLE IF EXISTS application_modules;
-- COMMIT;
-- ---------------------------------------------------------------------------------------------------
