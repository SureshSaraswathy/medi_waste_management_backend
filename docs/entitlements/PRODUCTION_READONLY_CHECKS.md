# Production read-only checks (prepared – NOT executed)

Nothing here has been run against production. The SQL was syntax-checked against the **development** databases in read-only sessions (all results were empty or zero there). Run production checks only after separate approval, preferably with a database user that has only `SELECT`.

## How to run (read-only session)
Every check is a plain `SELECT`. Force a read-only session so a typing mistake cannot write:

```bash
# bash / Git Bash
export PGOPTIONS="-c default_transaction_read_only=on"
psql -h <PROD_HOST> -p 5432 -U <READONLY_USER> -d <DATABASE> -v ON_ERROR_STOP=1 -X -f <file.sql>
```
```powershell
# PowerShell
$env:PGOPTIONS = "-c default_transaction_read_only=on"
psql -h <PROD_HOST> -p 5432 -U <READONLY_USER> -d <DATABASE> -v ON_ERROR_STOP=1 -X -f <file.sql>
```
Databases: **master** = `medi_waste_management_master` (companies, users, roles, permissions); **transaction** = `medi_waste_management_transaction` (compliance_register, BULK_DOWNLOADS). Take the real names from the production `.env` (`MASTER_DB_DATABASE`, `TRANSACTION_DB_DATABASE`).

## 1. Compliance register: row count and how each row would be attributed

Attribution rule (the only one used by `backfill-compliance-company.js`): `compliance_register.created_by → users.user_id → users.company_id`. Everything else stays NULL (visible to platform administrators only).

**1a. Counts – TRANSACTION database** (works before migration 006; `company_id` does not exist yet):
```sql
SELECT count(*)                                              AS total,
       count(*) FILTER (WHERE is_deleted)                    AS deleted,
       count(*) FILTER (WHERE NOT is_deleted)                AS live,
       count(*) FILTER (WHERE NOT is_deleted AND created_by IS NULL) AS live_without_creator
FROM compliance_register;
```
**1b. Creators – TRANSACTION database** (copy the single result value):
```sql
SELECT coalesce(string_agg(DISTINCT quote_literal(created_by::text), ','), '') AS creator_list
FROM compliance_register WHERE NOT is_deleted AND created_by IS NOT NULL;
```
**1c. Which customer each creator belongs to – MASTER database** (paste the list from 1b between the parentheses; if the list is empty there is nothing to attribute):
```sql
SELECT u.company_id, c.company_code, count(*) AS creators
FROM users u LEFT JOIN companies c ON c.company_id = u.company_id
WHERE u.user_id::text IN (/* paste creator_list here */)
GROUP BY 1, 2 ORDER BY 3 DESC;
```
Reading the result: rows counted in `live_without_creator` (1a) cannot be attributed; every other live row can, as long as its creator appears in 1c (a creator missing from 1c is a deleted/unknown user and also stays NULL). Do not assume the split: the numbers decide.

**1d. The script's own report** – prints the same plan with exact counts and the reason per row, read-only, and works before migration 006 too (then every row counts as not yet attributed). `--csv` writes one line per row (`id, proposed_company_id, ATTRIBUTABLE|UNATTRIBUTABLE, reason`) for review:
```bash
node scripts/entitlements/backfill-compliance-company.js --csv compliance-attribution.csv
```
The transaction database session is opened read-only (`default_transaction_read_only=on`), the master database is only ever read, and writing needs `--apply --confirm <db>` (not part of this report).

**1e. NULL count after the migration/back-fill – TRANSACTION database:**
```sql
SELECT count(*) FILTER (WHERE NOT is_deleted AND company_id IS NULL)     AS live_unattributed,
       count(*) FILTER (WHERE NOT is_deleted AND company_id IS NOT NULL) AS live_attributed
FROM compliance_register;
```

## 2. Who can create companies (`COMPANY_CREATE`) – MASTER database
```sql
SELECT p.permission_code, r.role_name, c.company_code,
       count(u.user_id) FILTER (WHERE NOT u.is_deleted) AS active_users
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p."permissionId"
JOIN roles r             ON r.role_id = rp.role_id
LEFT JOIN companies c    ON c.company_id = r.company_id
LEFT JOIN users u        ON u.user_role_id = r.role_id
WHERE p.permission_code IN ('COMPANY_CREATE', '*')
GROUP BY 1, 2, 3
ORDER BY 1, 2;
```
Expected: no customer role holds `COMPANY_CREATE`. Any row with `COMPANY_CREATE` and `active_users > 0` is a customer user who can create companies today; in tenant ENFORCE that user would be refused (decision needed before ENFORCE). Rows for `*` are platform administrators.

## 3. Unexpired bulk downloads without an owner – TRANSACTION database
Expiry is stored as `timestamp without time zone`. Check the server time zone first, then count:
```sql
SHOW timezone;

-- before migration 005 (no company_id column yet): every row is a "legacy" row
SELECT count(*)                                           AS total,
       count(*) FILTER (WHERE expire_at > now()::timestamp) AS unexpired
FROM "BULK_DOWNLOADS";

-- after migration 005
SELECT count(*)                                                              AS total,
       count(*) FILTER (WHERE company_id IS NULL)                            AS without_owner,
       count(*) FILTER (WHERE company_id IS NULL AND expire_at > now()::timestamp) AS unexpired_without_owner,
       count(*) FILTER (WHERE company_id IS NOT NULL AND expire_at > now()::timestamp) AS unexpired_with_owner
FROM "BULK_DOWNLOADS";
```
Meaning: links live 24 h. At download time the new code derives the owner of a legacy link from the manifest inside its ZIP; if that is impossible the link is refused (`DOWNLOAD_OWNER_UNVERIFIED`). Legacy rows are also hidden from every customer's download history (they stay visible to SuperAdmin; nothing is deleted). `unexpired_without_owner` is therefore the number of links that go through this derivation on the day of the deployment; it drops to zero within 24 hours. Optional file-level check on the backend host (read-only): list `storage/bulk-invoice-zips/` and confirm the unexpired files exist.

## 4. Does the production connection support LISTEN/NOTIFY?
The application connects with plain `pg` (`host`/`port` from `MASTER_DB_HOST`/`MASTER_DB_PORT`, no pooler options in `database.config.ts`); the listener opens its own direct connection with the same settings, so it works whenever those point at PostgreSQL itself. It does **not** work through a transaction-pooling proxy (PgBouncer in `transaction` mode, RDS Proxy, some managed poolers) because `LISTEN` needs a session that stays open. Read-only checks:
```bash
# which server/port does production use? (port 6432 or a pooler/proxy host name is a warning sign)
pm2 env <app-id> | grep -E 'DB_(HOST|PORT)'      # or inspect the deployed environment file without printing passwords
```
```sql
SELECT version();
SHOW listen_addresses;
SELECT application_name, state, count(*) FROM pg_stat_activity WHERE datname = current_database() GROUP BY 1, 2;
```
A direct PostgreSQL answers `version()` with `PostgreSQL ...`; PgBouncer's admin console answers `SHOW POOLS` / `SHOW CONFIG` (look for `pool_mode`). End-to-end proof from a throwaway session (sends one ephemeral notification, writes nothing):
```bash
psql "<connection string>" -X -c "LISTEN entitlement_probe" -c "SELECT pg_notify('entitlement_probe','ok')"
```
(`psql` reports the received notification when LISTEN works on that path.) If LISTEN is not available the system keeps working on the 10-second cache TTL; set `ENTITLEMENT_LISTEN=false` to stop the listener from retrying.
The listener sessions are visible afterwards as `application_name = 'entitlement-listener'` in `pg_stat_activity` (one per backend process).

## 5. Rest of the pre-flight (read-only unless stated)
- Entitlement tables do not exist yet: `SELECT to_regclass('public.company_entitlements');` → `NULL` before migration 001.
- Companies that will be back-filled (all active ones): `SELECT count(*) FROM companies WHERE NOT is_deleted AND status = 'Active';`
- Migrations are **not** part of this document; they need their own approval: dry-run first (`run-migrations.js --dry-run`, `run-transaction-migration.js --migration 005|006 --dry-run`).
