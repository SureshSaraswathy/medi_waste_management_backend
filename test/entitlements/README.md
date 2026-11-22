# Entitlement verification harnesses (not part of Jest)

These run against an in-memory Postgres (PGlite) built read-only from the dev schema/rows. They never connect to a
real database for writing. PGlite is intentionally NOT a project dependency: install it in a scratch folder
(`npm i @electric-sql/pglite`) and point NODE_PATH at it.

- replica.js: builds the replica (reads dev DB read-only).
- test-ent-migrations.js: migrations 001-004 (counts, untouched rows, idempotency, rollback, CLI refusals).
- ent-integration.ts: real controllers/guards/interceptor/service/repository over the replica (compile with tsc first).
- test-download.js: bulk ZIP link re-check and migration 005.

Env: BE=<backend folder>, DIST=<compiled backend dist>.

- browser-test.js: headless-Chrome test of the frontend with a stubbed API (module/submodule gating, SuperAdmin exemption,
  live refresh, admin screen). Run: `FE_DIST=<vite build output> node test/entitlements/browser-test.js`
  (build with `vite build --outDir <folder>`; uses the backend's puppeteer).
- test-compliance-backfill.js: migration 006 and the compliance back-fill (report plan, dry run, apply, idempotency, other
  columns untouched) on PGlite. Env: BE, PGT (folder holding replica.js).
- test-login-tokens.js: all six token-issuing paths with the REAL auth controller/use cases/JWT service (decodes the JWT) +
  channel validation. Env: DIST. (Plain Node: Jest cannot import TypeORM here.)
- test-listener.js: LISTEN/NOTIFY cross-process invalidation with two service instances, disconnect/reconnect, TTL
  fallback. Env: BE, DIST, PGT.
- browser-mobile-login-test.js: the mobile login page sends channel "mobile" to /auth/login and /auth/verify-otp.
- test-download-flow.js: complete bulk-download flow over HTTP (real controller/service/EntitlementService, real ZIP files): owner from the record or the ZIP manifest, refusals, entitlement at download time, Bearer SuperAdmin, nothing modified. Env: BE, DIST, PGT.
- test-listener-pg.js: two service instances against a REAL PostgreSQL server (creates and drops a throwaway database). Env: DIST; reads the backend .env for the server address only.
- test-login-channel-http.js: a disabled Mobile App / HCF Portal is refused AT LOGIN over HTTP (real auth controllers/use cases, real EntitlementService as the policy): 403 + message + no token, wrong password still 401, SuperAdmin/wildcard exempt, SHADOW/OFF. Env: BE, DIST, PGT.
- di-check.ts: dependency-injection shape of the global policy provider (compile with the harness tsconfig). Env: DIST.
