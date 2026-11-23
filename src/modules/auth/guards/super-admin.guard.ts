import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Allows only the SuperAdmin identity. Unlike a permission check, a role holding a normal permission set cannot pass
 * this guard. The SuperAdmin user id always passes; the username / e-mail form (as accepted by PermissionsGuard) only
 * counts for a token of the system company, because a user name is unique only WITHIN a customer: a customer user who
 * happens to be called "superadmin" must not be able to change application branding.
 */
/** Company id carried by SuperAdmin tokens (see LoginUseCase). */
const SYSTEM_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

/**
 * THE rule for "designated SuperAdmin" (identity, not permissions): the configured / default SuperAdmin user id, or the
 * SuperAdmin user name / e-mail on a token of the system company. A wildcard permission or a role name never qualifies.
 * Used by SuperAdminGuard and by GET /branding/access, so the UI and the API cannot disagree.
 */
export function isDesignatedSuperAdmin(user: any, cfg: { userId?: string; email?: string; username?: string } = {}): boolean {
  if (!user) return false;
  const ident = String(user.email || user.userName || '').toLowerCase().trim();
  const adminEmail = String(cfg.email || 'superadmin@medi-waste.io').toLowerCase().trim();
  const adminUser = String(cfg.username || 'superadmin').toLowerCase().trim();
  const bySystemIdentity = (ident === adminEmail || ident === adminUser) && user.companyId === SYSTEM_COMPANY_ID;
  return (!!cfg.userId && user.userId === cfg.userId) || user.userId === '00000000-0000-0000-0000-000000000001' || bySystemIdentity;
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('User not authenticated');
    if (!isDesignatedSuperAdmin(user, this.configService.get('app')?.superAdmin || {})) {
      throw new ForbiddenException('Only SuperAdmin can manage application branding');
    }
    return true;
  }
}
