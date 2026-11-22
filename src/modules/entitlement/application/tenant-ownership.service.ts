import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EndpointMapRow } from '../infrastructure/entitlement.repository';

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Looks up which company owns the record addressed by a request (GET/PUT/PATCH/DELETE on /:id).
 * The lookup rules come from endpoint_feature_map (table, key, database), never from the request.
 *
 * Returns the owning company id, null when the row exists but has no company, or undefined when the
 * record does not exist / the id is malformed (the controller then answers 404 or 400 as it does today).
 */
@Injectable()
export class TenantOwnershipService {
  private readonly logger = new Logger(TenantOwnershipService.name);
  private readonly sources: Record<string, DataSource>;

  constructor(
    @InjectDataSource('master') master: DataSource,
    @InjectDataSource('transaction') transaction: DataSource,
  ) {
    this.sources = { master, transaction };
  }

  private readonly hcfCache = new Map<string, { at: number; value: boolean }>();

  /** Company that owns a vehicle (master fleets.company_id). null = fleet without company, undefined = unknown vehicle. */
  async fleetCompany(vehicleId: string): Promise<string | null | undefined> {
    try {
      const r = await this.sources.master.query('SELECT company_id FROM fleets WHERE fleet_id = $1 LIMIT 1', [vehicleId]);
      return r[0] ? r[0].company_id ?? null : undefined;
    } catch (err: any) {
      this.logger.debug(`fleet lookup skipped: ${err?.message}`);
      return undefined; // malformed id: the controller answers as it does today
    }
  }

  /** Vehicle ids -> owning company, for filtering lists (one query). */
  async fleetCompanies(vehicleIds: string[]): Promise<Map<string, string | null>> {
    const out = new Map<string, string | null>();
    const ids = [...new Set(vehicleIds.filter(Boolean))];
    if (!ids.length) return out;
    try {
      const r = await this.sources.master.query('SELECT fleet_id, company_id FROM fleets WHERE fleet_id = ANY($1::uuid[])', [ids]);
      for (const x of r) out.set(x.fleet_id, x.company_id ?? null);
    } catch (err: any) {
      this.logger.debug(`fleet batch lookup skipped: ${err?.message}`);
    }
    return out;
  }

  /** True when the authenticated principal is an HCF (portal) account, independent of any token claim. Cached 60 s. */
  async isHcfPrincipal(userId: string): Promise<boolean> {
    const hit = this.hcfCache.get(userId);
    if (hit && Date.now() - hit.at < 60000) return hit.value;
    let value = false;
    try {
      const r = await this.sources.master.query('SELECT 1 FROM hcfs WHERE hcf_id = $1 LIMIT 1', [userId]);
      value = r.length > 0;
    } catch {
      value = false; // not a uuid: not an HCF
    }
    if (this.hcfCache.size > 5000) this.hcfCache.clear();
    this.hcfCache.set(userId, { at: Date.now(), value });
    return value;
  }

  async ownerOf(row: EndpointMapRow, paramValue: string): Promise<string | null | undefined> {
    const ds = row.tenantDb ? this.sources[row.tenantDb] : undefined;
    if (!ds) return undefined;
    try {
      if (row.tenantMode === 'VIA_FLEET' && row.tenantTable && row.tenantPk && IDENT.test(row.tenantTable) && IDENT.test(row.tenantPk)) {
        const r = await ds.query(`SELECT vehicle_id FROM "${row.tenantTable}" WHERE "${row.tenantPk}" = $1 LIMIT 1`, [paramValue]);
        if (!r[0]) return undefined;
        return this.fleetCompany(r[0].vehicle_id);
      }
      if (row.tenantMode === 'VIA' && row.tenantViaSql) {
        const r = await ds.query(row.tenantViaSql, [paramValue]);
        return r[0] ? r[0].company_id ?? null : undefined;
      }
      if ((row.tenantMode === 'DIRECT' || row.tenantMode === 'DIRECT_STRICT') && row.tenantTable && row.tenantPk && IDENT.test(row.tenantTable) && IDENT.test(row.tenantPk)) {
        const r = await ds.query(`SELECT company_id FROM "${row.tenantTable}" WHERE "${row.tenantPk}" = $1 LIMIT 1`, [paramValue]);
        return r[0] ? r[0].company_id ?? null : undefined;
      }
    } catch (err: any) {
      // malformed id (e.g. not a uuid) or a transient error: do not decide here, the controller handles it
      this.logger.debug(`ownership lookup skipped for ${row.tenantTable}: ${err?.message}`);
    }
    return undefined;
  }
}
