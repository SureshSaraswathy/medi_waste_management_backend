import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { defer, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { normalizeRoute } from '../domain/entitlement.rules';
import { EntitlementService, RolloutMode } from '../application/entitlement.service';
import { TenantOwnershipService } from '../application/tenant-ownership.service';
import { EndpointMapRow } from '../infrastructure/entitlement.repository';

type Post = ((data: any) => any | Promise<any>) | null;

/**
 * Global request interceptor: customer licensing (module / submodule / feature entitlements) and tenant
 * ownership. It runs AFTER the existing guards, so authentication (401) and RBAC (403) behave exactly as
 * before and never reach it when they fail. It only looks at authenticated requests.
 *
 * Both switches default to OFF (nothing happens). SHADOW records what WOULD be blocked and lets the request
 * continue. ENFORCE blocks with 403. The customer is always taken from the verified JWT, never from the request.
 */
/** Controllers that stay reachable when a channel is disabled, so the app can read its own state and sign out. */
const CHANNEL_OPEN = new Set(['entitlement-me', 'auth', 'permissions', 'branding']);

@Injectable()
export class EntitlementInterceptor implements NestInterceptor {
  constructor(private readonly svc: EntitlementService, private readonly ownership: TenantOwnershipService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    return defer(() => this.precheck(req)).pipe(
      mergeMap((post: Post) => (post ? next.handle().pipe(mergeMap((data) => Promise.resolve(post(data)))) : next.handle())),
    );
  }

  private async precheck(req: any): Promise<Post> {
    const user = req.user;
    if (!user || req.method === 'OPTIONS') return null; // public route or preflight
    const modes = await this.svc.getModes();
    if (modes.mode === 'OFF' && modes.tenantMode === 'OFF') return null;
    if (this.svc.isPlatformAdmin(user)) return null; // SuperAdmin keeps cross-customer access and is never licensed away

    const routePath = req.route && req.route.path ? normalizeRoute(String(req.route.path)) : null;
    if (!routePath) return null; // no matched route (404 will follow)
    const method = String(req.method).toUpperCase();
    const key = `${method} ${routePath}`;
    const map = await this.svc.getEndpointMap();
    const row = map.get(key);
    const tenant: string | undefined = user.companyId;

    const record = (reason: string, detail?: string) => this.svc.recordShadow({ companyId: tenant || '', method, route: routePath, reason, userId: user.userId, detail });
    const decide = (reason: string, mode: RolloutMode, code: string, message: string, extra: Record<string, unknown> = {}) => {
      if (mode === 'ENFORCE') throw new ForbiddenException({ success: false, code, message, ...extra });
      if (mode === 'SHADOW') record(reason, extra && typeof (extra as any).detail === 'string' ? ((extra as any).detail as string) : undefined);
    };

    if (modes.mode !== 'OFF' || modes.tenantMode !== 'OFF') this.svc.recordCoverage(method, routePath);

    if (!tenant) {
      decide('NO_COMPANY', modes.tenantMode, 'TENANT_MISMATCH', 'Your account is not linked to a customer.');
      return null;
    }

    // ------------------------------------------------------------ tenant ownership
    let post: Post = null;
    if (modes.tenantMode !== 'OFF' && row) post = await this.checkTenant(req, row, tenant, modes.tenantMode, record, decide);

    // ------------------------------------------------------------ channel entitlements (HCF Portal, Mobile App)
    // The channel comes from the SIGNED token claim (login channel) and, for HCF accounts, from the account itself,
    // so a client cannot change it. It applies to every authenticated request except the few that let the app
    // read its own entitlement state and permissions.
    if (modes.mode !== 'OFF' && !(row && row.controller && CHANNEL_OPEN.has(row.controller))) {
      const claim = user.channel;
      let channel: 'HCF_PORTAL' | 'MOBILE_APP' | null = claim === 'HCF_PORTAL' || user.userType === 'HCF' ? 'HCF_PORTAL' : claim === 'MOBILE' ? 'MOBILE_APP' : null;
      if (!channel && (await this.ownership.isHcfPrincipal(user.userId))) channel = 'HCF_PORTAL';
      if (channel && !(await this.svc.isEntitled(tenant, [channel]))) {
        const message = channel === 'HCF_PORTAL'
          ? 'The HCF Portal is not enabled for your organisation. Please contact your administrator.'
          : 'The Mobile App is not enabled for your organisation. Please contact your administrator.';
        decide('DISABLED', modes.mode, 'FEATURE_NOT_LICENSED', message, { feature: channel, channel });
      }
    }

    // ------------------------------------------------------------ licensing
    if (modes.mode !== 'OFF') {
      if (!row) {
        decide('UNMAPPED', modes.mode, 'ENDPOINT_NOT_MAPPED', 'This endpoint has no entitlement mapping.');
      } else if (row.featureCodes && row.featureCodes.length > 0) {
        const ok = await this.svc.isEntitled(tenant, row.featureCodes);
        if (!ok) decide('DISABLED', modes.mode, 'FEATURE_NOT_LICENSED', 'This feature is not included in your plan.', { feature: row.featureCodes.join(' | ') });
      }
    }
    return post;
  }

  private async checkTenant(
    req: any, row: EndpointMapRow, tenant: string, mode: RolloutMode,
    record: (reason: string, detail?: string) => void,
    decide: (reason: string, mode: RolloutMode, code: string, message: string, extra?: Record<string, unknown>) => void,
  ): Promise<Post> {
    const mismatch = (detail: string) => decide('TENANT_MISMATCH', mode, 'TENANT_MISMATCH', 'This record belongs to a different customer.', { detail });
    let post: Post = null;

    // a client-supplied company in the query or body must be the caller's own company
    const q = req.query && req.query.companyId;
    if (row.queryHasCompany) {
      if (q && String(q) !== tenant) mismatch('query companyId differs from your customer');
      else if (!q && mode === 'ENFORCE') req.query.companyId = tenant;
    }
    if (row.bodyHasCompany && req.body && typeof req.body === 'object') {
      const b = req.body.companyId;
      if (b && String(b) !== tenant) mismatch('body companyId differs from your customer');
      else if (!b && mode === 'ENFORCE') req.body.companyId = tenant;
    }

    // the record addressed by the path must belong to the caller's company
    const param = row.tenantParam ? req.params && req.params[row.tenantParam] : undefined;
    switch (row.tenantMode) {
      case 'PARAM_IS_COMPANY':
        if (param && String(param) !== tenant) mismatch('path company differs from your customer');
        break;
      case 'SELF':
        if (param) {
          if (String(param) !== tenant) mismatch('record belongs to a different customer');
        } else if (req.method === 'GET') {
          // the company list: a customer may only see its own company
          post = (data: any) => {
            const items = data && Array.isArray(data.data) ? data.data : null;
            if (!items || items.every((c: any) => c && c.id === tenant)) return data;
            if (mode === 'ENFORCE') return { ...data, data: items.filter((c: any) => c && c.id === tenant) };
            record('TENANT_MISMATCH', 'company list returned other customers');
            return data;
          };
        } else if (req.method === 'POST') {
          mismatch('a customer user cannot create another customer');
        }
        break;
      case 'DIRECT':
      case 'VIA':
        if (param) {
          const owner = await this.ownership.ownerOf(row, String(param));
          if (owner && owner !== tenant) mismatch('record belongs to a different customer');
        }
        break;
      case 'DIRECT_STRICT':
      case 'VIA_FLEET': {
        // a record WITHOUT an owner (unattributed legacy row, vehicle without a fleet company) is not a customer's record
        if (param) {
          const owner = await this.ownership.ownerOf(row, String(param));
          if (owner !== undefined && owner !== tenant) mismatch('record belongs to a different customer or has no owner');
        }
        if (row.tenantMode === 'VIA_FLEET') {
          // a vehicle named by the client (body or query) must be one of the caller's own fleet vehicles
          const named = [req.body && typeof req.body === 'object' ? req.body.vehicleId : undefined, req.query ? req.query.vehicleId : undefined].filter(Boolean).map(String);
          for (const v of named) {
            const vo = await this.ownership.fleetCompany(v);
            if (vo !== undefined && vo !== tenant) mismatch('vehicle belongs to a different customer');
          }
        }
        if (!param && req.method === 'GET') {
          // the list: never return another customer's rows
          post = async (data: any) => {
            const items = data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : null;
            if (!items) return data;
            let keep: any[];
            if (row.tenantMode === 'VIA_FLEET') {
              const owners = await this.ownership.fleetCompanies(items.map((i: any) => i && i.vehicleId));
              keep = items.filter((i: any) => i && owners.get(i.vehicleId) === tenant);
            } else {
              keep = items.filter((i: any) => i && i.companyId === tenant);
            }
            if (keep.length === items.length) return data;
            if (mode === 'ENFORCE') return Array.isArray(data) ? keep : { ...data, data: keep };
            record('TENANT_MISMATCH', 'list contained records of other customers');
            return data;
          };
        }
        break;
      }
      case 'IN_CODE':
        break; // scoped inside the controller itself
      case 'UNSCOPED':
        record('UNSCOPED_RESOURCE', 'resource has no company reference');
        break;
      default:
        break; // GLOBAL or no rule
    }
    return post;
  }
}
