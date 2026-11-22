/**
 * Customer Entitlements - pure rules (no framework, no database).
 *
 * Effective access of a catalogue node for one customer:
 *
 *   effective(node) = core(node)  OR  ( active(node) AND stored(node) AND effective-chain(parents) )
 *
 * - `stored` is the customer's own switch for that node. A missing row means DISABLED.
 * - Switching a parent off never changes the stored flags of its children, so switching it back on
 *   restores exactly what was configured before (children keep their own choice).
 * - Core nodes (Dashboard, Profile, Administration) are always effective and can never be disabled.
 * - Entitlement only SUBTRACTS access. It never grants a permission: the user's RBAC permission is
 *   still required separately.
 */
export type NodeType = 'MODULE' | 'SUBMODULE' | 'FEATURE';

export interface CatalogueNode {
  code: string;
  type: NodeType;
  name: string;
  parent: string | null;
  core: boolean;
  active: boolean;
  sort: number;
  introducedIn?: string | null;
  // module / submodule extras
  route?: string | null;
  // feature extras
  featureType?: string;
  enforcement?: string;
  permissionCode?: string | null;
}

export class Catalogue {
  readonly byCode = new Map<string, CatalogueNode>();
  readonly children = new Map<string, CatalogueNode[]>();

  constructor(nodes: CatalogueNode[]) {
    nodes.forEach((n) => this.byCode.set(n.code, n));
    nodes
      .slice()
      .sort((a, b) => a.sort - b.sort || a.code.localeCompare(b.code))
      .forEach((n) => {
        if (!n.parent) return;
        const list = this.children.get(n.parent) || [];
        list.push(n);
        this.children.set(n.parent, list);
      });
  }

  has(code: string): boolean {
    return this.byCode.has(code);
  }

  get(code: string): CatalogueNode | undefined {
    return this.byCode.get(code);
  }

  modules(): CatalogueNode[] {
    return [...this.byCode.values()].filter((n) => n.type === 'MODULE').sort((a, b) => a.sort - b.sort);
  }

  childrenOf(code: string): CatalogueNode[] {
    return this.children.get(code) || [];
  }

  /** node, then its parent, then the module: [self, ..., module] */
  chain(code: string): CatalogueNode[] {
    const out: CatalogueNode[] = [];
    let cur = this.byCode.get(code);
    let guard = 0;
    while (cur && guard++ < 5) {
      out.push(cur);
      cur = cur.parent ? this.byCode.get(cur.parent) : undefined;
    }
    return out;
  }

  /** All descendants (submodules and features) of a node. */
  descendants(code: string): CatalogueNode[] {
    const out: CatalogueNode[] = [];
    const walk = (c: string) => this.childrenOf(c).forEach((k) => { out.push(k); walk(k.code); });
    walk(code);
    return out;
  }
}

/** True when the node, or any ancestor, is core. */
export function isCore(cat: Catalogue, code: string): boolean {
  return cat.chain(code).some((n) => n.core);
}

/** Stored flags: code -> is_enabled. A missing key means no row, which counts as disabled. */
export type StoredFlags = Map<string, boolean>;

export function isEffective(cat: Catalogue, stored: StoredFlags, code: string): boolean {
  const chain = cat.chain(code);
  if (chain.length === 0) return false; // unknown code: never allowed
  if (chain.some((n) => n.core)) return chain.every((n) => n.active);
  return chain.every((n) => n.active && stored.get(n.code) === true);
}

/** ANY-OF: entitled when at least one listed code is effective. Unknown codes are ignored. */
export function anyEffective(cat: Catalogue, stored: StoredFlags, codes: string[]): boolean {
  return codes.some((c) => isEffective(cat, stored, c));
}

export interface EffectiveSets {
  modules: string[];
  submodules: string[];
  features: string[];
}

export function effectiveSets(cat: Catalogue, stored: StoredFlags): EffectiveSets {
  const out: EffectiveSets = { modules: [], submodules: [], features: [] };
  for (const n of cat.byCode.values()) {
    if (!isEffective(cat, stored, n.code)) continue;
    if (n.type === 'MODULE') out.modules.push(n.code);
    else if (n.type === 'SUBMODULE') out.submodules.push(n.code);
    else out.features.push(n.code);
  }
  out.modules.sort(); out.submodules.sort(); out.features.sort();
  return out;
}

export interface ChangeInput {
  code: string;
  enabled: boolean;
}

export interface ChangeError {
  code: string;
  error: 'UNKNOWN_CODE' | 'CORE_LOCKED' | 'DUPLICATE' | 'INVALID_VALUE';
  message: string;
}

/** Validates a requested set of changes without touching any data. */
export function validateChanges(cat: Catalogue, changes: ChangeInput[]): ChangeError[] {
  const errors: ChangeError[] = [];
  const seen = new Set<string>();
  for (const c of changes) {
    if (!c || typeof c.code !== 'string' || typeof c.enabled !== 'boolean') {
      errors.push({ code: String(c && c.code), error: 'INVALID_VALUE', message: 'Each change needs a code and a boolean "enabled".' });
      continue;
    }
    if (!cat.has(c.code)) { errors.push({ code: c.code, error: 'UNKNOWN_CODE', message: `Unknown catalogue code ${c.code}` }); continue; }
    if (seen.has(c.code)) { errors.push({ code: c.code, error: 'DUPLICATE', message: `${c.code} appears more than once` }); continue; }
    seen.add(c.code);
    if (!c.enabled && isCore(cat, c.code)) errors.push({ code: c.code, error: 'CORE_LOCKED', message: `${c.code} is a core item and cannot be disabled` });
  }
  return errors;
}

export interface PlannedChange {
  code: string;
  type: NodeType;
  oldValue: boolean | null;
  newValue: boolean;
}

/**
 * Turns requested changes into the rows that really need writing:
 *  - a row that does not exist yet is created (old = null) even when the value is false, so the NEW marker clears;
 *  - an existing row is rewritten only when the value differs;
 *  - core nodes are never written (they are always enabled).
 */
export function planChanges(cat: Catalogue, stored: StoredFlags, changes: ChangeInput[]): PlannedChange[] {
  const plan: PlannedChange[] = [];
  for (const c of changes) {
    const node = cat.get(c.code);
    if (!node || isCore(cat, c.code)) continue;
    const old = stored.has(c.code) ? (stored.get(c.code) as boolean) : null;
    if (old === c.enabled) continue;
    plan.push({ code: c.code, type: node.type, oldValue: old, newValue: c.enabled });
  }
  return plan;
}

/** Super administrator detection, identical to the existing guards (identity based, never role based). */
export function isSuperAdminUser(user: any, cfg: { userId?: string; email?: string; username?: string } | undefined): boolean {
  if (!user) return false;
  const c = cfg || {};
  if (user.userId && (user.userId === c.userId || user.userId === '00000000-0000-0000-0000-000000000001')) return true;
  const ident = String(user.email || user.userName || '').toLowerCase().trim();
  const email = String(c.email || 'superadmin@medi-waste.io').toLowerCase().trim();
  const username = String(c.username || 'superadmin').toLowerCase().trim();
  return ident === email || ident === username;
}

/**
 * Platform administrator in the sense of the existing PermissionsGuard: the SuperAdmin identity, the wildcard
 * permission or the superadmin role. Exempt from licensing and tenant rules. (Managing entitlements is NOT decided
 * by this: that stays identity-only, see isSuperAdminUser and EntitlementAdminGuard.)
 */
export function isPlatformAdminUser(user: any, cfg?: { userId?: string; email?: string; username?: string }): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user, cfg)) return true;
  if (Array.isArray(user.permissions) && user.permissions.includes('*')) return true;
  return Array.isArray(user.roles) && (user.roles.includes('superadmin') || user.roles.includes('SUPER_ADMIN'));
}

export function normalizeRoute(path: string): string {
  return (path || '').replace(/^\/api\/v\d+/, '') || '/';
}
