import { ENTITLEMENT_ALL, ENTITLEMENT_CHANNEL } from './entitlement-change-listener';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CatalogueNode, PlannedChange, StoredFlags } from '../domain/entitlement.rules';

/**
 * Minimal SQL surface used by the entitlement module. The production implementation wraps the TypeORM
 * `master` DataSource; tests plug in an in-memory PostgreSQL with the same interface.
 *
 * The entitlement tables are deliberately NOT TypeORM entities: synchronize can never alter or drop them.
 */
export interface SqlRunner {
  query(sql: string, params?: any[]): Promise<any[]>;
  transaction<T>(work: (tx: SqlRunner) => Promise<T>): Promise<T>;
}

export class DataSourceRunner implements SqlRunner {
  constructor(private readonly ds: DataSource) {}
  query(sql: string, params?: any[]): Promise<any[]> {
    return this.ds.query(sql, params);
  }
  transaction<T>(work: (tx: SqlRunner) => Promise<T>): Promise<T> {
    return this.ds.transaction(async (manager) => work({ query: (s, p) => manager.query(s, p), transaction: (w) => w(this) } as SqlRunner));
  }
}

export interface EndpointMapRow {
  httpMethod: string;
  routePattern: string;
  featureCodes: string[] | null;
  exemptReason: string | null;
  mappingSource: string;
  controller: string | null;
  tenantMode: string | null;
  tenantDb: string | null;
  tenantTable: string | null;
  tenantPk: string | null;
  tenantParam: string | null;
  tenantViaSql: string | null;
  bodyHasCompany: boolean;
  queryHasCompany: boolean;
  deprecated: boolean;
}

export interface CompanySummary {
  companyId: string;
  companyCode: string;
  companyName: string;
  status: string;
  enabledModules: number;
  totalModules: number;
  newItems: number;
}

export interface AuditRow {
  auditId: string;
  batchId: string;
  companyId: string;
  entityCode: string;
  oldValue: boolean | null;
  newValue: boolean;
  action: string;
  changedBy: string | null;
  changedByName: string | null;
  changedOn: string;
  reason: string | null;
}

export interface ShadowEvent {
  day: string;
  companyId: string;
  method: string;
  route: string;
  reason: string;
  hits: number;
  userId?: string | null;
  detail?: string | null;
}

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class EntitlementRepository {
  private readonly db: SqlRunner;

  constructor(@InjectDataSource('master') ds: DataSource) {
    this.db = new DataSourceRunner(ds);
  }

  /** Test hook: build a repository over any SqlRunner. */
  static over(runner: SqlRunner): EntitlementRepository {
    const r = Object.create(EntitlementRepository.prototype) as { db: SqlRunner };
    r.db = runner;
    return r as unknown as EntitlementRepository;
  }

  // ---------------------------------------------------------------- catalogue
  async loadCatalogue(): Promise<CatalogueNode[]> {
    const modules = await this.db.query(`SELECT module_code, module_name, sort_order, is_core, status, introduced_in FROM application_modules`);
    const subs = await this.db.query(`SELECT s.submodule_code, s.submodule_name, s.sort_order, s.is_core, s.status, s.introduced_in, s.route_prefix, m.module_code
                                        FROM application_submodules s JOIN application_modules m ON m.module_id = s.module_id`);
    const feats = await this.db.query(`SELECT f.feature_code, f.feature_name, f.sort_order, f.status, f.introduced_in, f.feature_type, f.enforcement, f.permission_code, s.submodule_code
                                         FROM application_features f JOIN application_submodules s ON s.submodule_id = f.submodule_id`);
    return [
      ...modules.map((m: any): CatalogueNode => ({ code: m.module_code, type: 'MODULE', name: m.module_name, parent: null, core: !!m.is_core, active: m.status === 'Active', sort: Number(m.sort_order), introducedIn: m.introduced_in })),
      ...subs.map((s: any): CatalogueNode => ({ code: s.submodule_code, type: 'SUBMODULE', name: s.submodule_name, parent: s.module_code, core: !!s.is_core, active: s.status === 'Active', sort: Number(s.sort_order), introducedIn: s.introduced_in, route: s.route_prefix })),
      ...feats.map((f: any): CatalogueNode => ({ code: f.feature_code, type: 'FEATURE', name: f.feature_name, parent: f.submodule_code, core: false, active: f.status === 'Active', sort: Number(f.sort_order), introducedIn: f.introduced_in, featureType: f.feature_type, enforcement: f.enforcement, permissionCode: f.permission_code })),
    ];
  }

  async loadEndpointMap(): Promise<EndpointMapRow[]> {
    const rows = await this.db.query(`SELECT * FROM endpoint_feature_map`);
    return rows.map((r: any) => ({
      httpMethod: r.http_method, routePattern: r.route_pattern, featureCodes: r.feature_code ? String(r.feature_code).split('|') : null,
      exemptReason: r.exempt_reason, mappingSource: r.mapping_source, controller: r.controller, tenantMode: r.tenant_mode, tenantDb: r.tenant_db,
      tenantTable: r.tenant_table, tenantPk: r.tenant_pk, tenantParam: r.tenant_param, tenantViaSql: r.tenant_via_sql,
      bodyHasCompany: !!r.body_has_company, queryHasCompany: !!r.query_has_company, deprecated: !!r.deprecated,
    }));
  }

  // ---------------------------------------------------------------- company configuration
  async loadCompanyFlags(companyId: string): Promise<{ flags: StoredFlags; version: string }> {
    const rows = await this.db.query(`SELECT entity_code, is_enabled FROM company_entitlements WHERE company_id = $1 ORDER BY entity_code`, [companyId]);
    const flags: StoredFlags = new Map();
    rows.forEach((r: any) => flags.set(r.entity_code, !!r.is_enabled));
    const v = await this.db.query(`SELECT md5(coalesce(string_agg(entity_code || '=' || is_enabled::text, ',' ORDER BY entity_code), '')) AS v FROM company_entitlements WHERE company_id = $1`, [companyId]);
    return { flags, version: v[0].v };
  }

  async companyExists(companyId: string): Promise<{ companyId: string; companyCode: string; companyName: string } | null> {
    const r = await this.db.query(`SELECT company_id, company_code, company_name FROM companies WHERE company_id = $1 AND is_deleted = FALSE`, [companyId]);
    return r[0] ? { companyId: r[0].company_id, companyCode: r[0].company_code, companyName: r[0].company_name } : null;
  }

  async listCompanies(): Promise<CompanySummary[]> {
    const rows = await this.db.query(`
      SELECT c.company_id, c.company_code, c.company_name, c.status,
             (SELECT count(*) FROM company_entitlements e WHERE e.company_id = c.company_id AND e.entity_type = 'MODULE' AND e.is_enabled)::int AS enabled_modules,
             (SELECT count(*) FROM application_modules WHERE status = 'Active')::int AS total_modules,
             ((SELECT count(*) FROM application_modules WHERE status = 'Active') + (SELECT count(*) FROM application_submodules WHERE status = 'Active') + (SELECT count(*) FROM application_features WHERE status = 'Active')
              - (SELECT count(*) FROM company_entitlements e WHERE e.company_id = c.company_id))::int AS new_items
        FROM companies c WHERE c.is_deleted = FALSE ORDER BY c.company_code`);
    return rows.map((r: any) => ({ companyId: r.company_id, companyCode: r.company_code, companyName: r.company_name, status: r.status, enabledModules: r.enabled_modules, totalModules: r.total_modules, newItems: Math.max(0, r.new_items) }));
  }

  /**
   * Writes the planned rows and their audit rows in ONE transaction. Rows are upserted, never deleted.
   * Returns the batch id shared by all audit rows of this save.
   */
  async applyChanges(companyId: string, plan: PlannedChange[], meta: { userId: string | null; userName: string | null; reason: string | null; action: 'SET' | 'COPY' }): Promise<string> {
    return this.db.transaction(async (tx) => {
      const batch = (await tx.query(`SELECT gen_random_uuid() AS b`))[0].b as string;
      for (const p of plan) {
        await tx.query(
          `INSERT INTO company_entitlements (company_id, entity_type, entity_code, is_enabled, updated_by, updated_on)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (company_id, entity_code) DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_by = EXCLUDED.updated_by, updated_on = NOW()`,
          [companyId, p.type, p.code, p.newValue, meta.userId],
        );
        await tx.query(
          `INSERT INTO company_entitlement_audit (batch_id, company_id, entity_code, old_value, new_value, action, changed_by, changed_by_name, reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [batch, companyId, p.code, p.oldValue, p.newValue, meta.action, meta.userId, meta.userName, meta.reason],
        );
      }
      // tell every backend process (delivered only when this transaction commits)
      await tx.query(`SELECT pg_notify($1, $2)`, [ENTITLEMENT_CHANNEL, companyId]);
      return batch;
    });
  }

  async getAudit(companyId: string, opts: { page: number; pageSize: number; code?: string; user?: string; from?: string; to?: string }): Promise<{ rows: AuditRow[]; total: number }> {
    const where = ['company_id = $1'];
    const params: any[] = [companyId];
    if (opts.code) { params.push(`%${opts.code}%`); where.push(`entity_code ILIKE $${params.length}`); }
    if (opts.user) { params.push(`%${opts.user}%`); where.push(`changed_by_name ILIKE $${params.length}`); }
    if (opts.from) { params.push(opts.from); where.push(`changed_on >= $${params.length}::timestamp`); }
    if (opts.to) { params.push(opts.to); where.push(`changed_on < ($${params.length}::date + 1)`); }
    const w = where.join(' AND ');
    const total = (await this.db.query(`SELECT count(*)::int AS n FROM company_entitlement_audit WHERE ${w}`, params))[0].n as number;
    const rows = await this.db.query(
      `SELECT audit_id, batch_id, company_id, entity_code, old_value, new_value, action, changed_by, changed_by_name, changed_on, reason
         FROM company_entitlement_audit WHERE ${w} ORDER BY changed_on DESC, audit_id DESC LIMIT ${Number(opts.pageSize)} OFFSET ${Number(opts.page - 1) * Number(opts.pageSize)}`,
      params,
    );
    return {
      total,
      rows: rows.map((r: any) => ({ auditId: String(r.audit_id), batchId: r.batch_id, companyId: r.company_id, entityCode: r.entity_code, oldValue: r.old_value, newValue: r.new_value, action: r.action, changedBy: r.changed_by, changedByName: r.changed_by_name, changedOn: new Date(r.changed_on).toISOString(), reason: r.reason })),
    };
  }

  // ---------------------------------------------------------------- settings
  async getSetting(key: string): Promise<string | null> {
    const r = await this.db.query(`SELECT setting_value FROM entitlement_settings WHERE setting_key = $1`, [key]);
    return r[0] ? r[0].setting_value : null;
  }

  async setSetting(key: string, value: string, userId: string | null): Promise<void> {
    // one statement: the write and the notification commit together
    await this.db.query(
      `WITH up AS (
         INSERT INTO entitlement_settings (setting_key, setting_value, updated_by, updated_on) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by, updated_on = NOW()
         RETURNING 1)
       SELECT pg_notify($4, $5) FROM up`,
      [key, value, userId, ENTITLEMENT_CHANNEL, ENTITLEMENT_ALL],
    );
  }

  // ---------------------------------------------------------------- shadow log and coverage
  async flushShadow(events: ShadowEvent[]): Promise<void> {
    for (const e of events) {
      await this.db.query(
        `INSERT INTO entitlement_shadow_log (day, company_id, http_method, route_pattern, reason, hit_count, sample_user_id, detail)
         VALUES ($1::date, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (day, company_id, http_method, route_pattern, reason)
         DO UPDATE SET hit_count = entitlement_shadow_log.hit_count + EXCLUDED.hit_count, last_seen = NOW(), sample_user_id = EXCLUDED.sample_user_id`,
        [e.day, e.companyId || NIL_UUID, e.method, e.route, e.reason, e.hits, e.userId || null, e.detail || null],
      );
    }
  }

  async flushCoverage(day: string, rows: Array<{ method: string; route: string; hits: number }>): Promise<void> {
    for (const r of rows) {
      await this.db.query(
        `INSERT INTO entitlement_coverage_daily (day, http_method, route_pattern, hit_count) VALUES ($1::date, $2, $3, $4)
         ON CONFLICT (day, http_method, route_pattern) DO UPDATE SET hit_count = entitlement_coverage_daily.hit_count + EXCLUDED.hit_count`,
        [day, r.method, r.route, r.hits],
      );
    }
  }

  async shadowReport(days: number) {
    const since = `CURRENT_DATE - ${Math.max(1, Math.floor(days))}`;
    const byReason = await this.db.query(
      `SELECT reason, sum(hit_count)::int AS hits, count(DISTINCT (http_method || ' ' || route_pattern))::int AS endpoints, count(DISTINCT company_id)::int AS companies
         FROM entitlement_shadow_log WHERE day >= ${since} GROUP BY reason ORDER BY reason`);
    const top = await this.db.query(
      `SELECT reason, http_method, route_pattern, sum(hit_count)::int AS hits FROM entitlement_shadow_log WHERE day >= ${since}
        GROUP BY reason, http_method, route_pattern ORDER BY sum(hit_count) DESC LIMIT 40`);
    const byCompany = await this.db.query(
      `SELECT l.company_id, c.company_code, l.reason, sum(l.hit_count)::int AS hits FROM entitlement_shadow_log l
         LEFT JOIN companies c ON c.company_id = l.company_id WHERE l.day >= ${since} GROUP BY l.company_id, c.company_code, l.reason ORDER BY sum(l.hit_count) DESC LIMIT 60`);
    const coverage = (await this.db.query(
      `SELECT (SELECT count(*) FROM endpoint_feature_map WHERE mapping_source <> 'EXEMPT')::int AS total,
              (SELECT count(DISTINCT (http_method || ' ' || route_pattern)) FROM entitlement_coverage_daily WHERE day >= ${since})::int AS exercised`))[0];
    const neverHit = await this.db.query(
      `SELECT m.http_method, m.route_pattern FROM endpoint_feature_map m
        WHERE m.mapping_source <> 'EXEMPT' AND NOT EXISTS (SELECT 1 FROM entitlement_coverage_daily c WHERE c.http_method = m.http_method AND c.route_pattern = m.route_pattern AND c.day >= ${since})
        ORDER BY m.route_pattern LIMIT 400`);
    const daysSeen = (await this.db.query(`SELECT count(DISTINCT day)::int AS n FROM entitlement_coverage_daily WHERE day >= ${since}`))[0].n as number;
    return { byReason, top, byCompany, coverage, neverHit, daysObserved: daysSeen };
  }
}
