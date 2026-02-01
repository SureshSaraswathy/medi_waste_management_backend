/**
 * Permission utilities
 *
 * Convention:
 * - Prefer permission_code values in the format: <FEATURE>.<ACTION>
 *   Examples: INVOICE.VIEW, INVOICE.CREATE, INVOICE.APPROVE, DASHBOARD_CONFIG.VIEW
 *
 * Backward compatibility:
 * - Existing systems may store permission codes using underscores (e.g. INVOICE_VIEW).
 * - `hasPermission` supports both by normalizing between '.' and '_' when checking.
 */

export function normalizePermissionCode(code: string): string[] {
  const c = (code || '').trim();
  if (!c) return [];
  const variants = new Set<string>();
  variants.add(c);

  // Support FEATURE.ACTION <-> FEATURE_ACTION
  if (c.includes('.')) variants.add(c.replace(/\./g, '_'));
  if (c.includes('_')) variants.add(c.replace(/_/g, '.'));

  return Array.from(variants);
}

export function hasPermission(userPermissions: string[], requiredPermissionCode: string): boolean {
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false;

  // SUPER_ADMIN wildcard: allow everything
  if (userPermissions.includes('*')) return true;

  const requiredVariants = normalizePermissionCode(requiredPermissionCode);
  if (requiredVariants.length === 0) return false;

  // Direct match against any variant
  for (const v of requiredVariants) {
    if (userPermissions.includes(v)) return true;
  }

  return false;
}

