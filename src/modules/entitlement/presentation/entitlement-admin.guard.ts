import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { EntitlementService } from '../application/entitlement.service';

/**
 * Only the SuperAdmin identity may manage customer entitlements. A Customer Admin, even one holding every
 * RBAC permission, is refused. (Own guard: the entitlement feature does not depend on any other feature.)
 */
@Injectable()
export class EntitlementAdminGuard implements CanActivate {
  constructor(private readonly svc: EntitlementService) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('User not authenticated');
    if (!this.svc.isSuperAdmin(user)) throw new ForbiddenException('Only SuperAdmin can manage customer entitlements');
    return true;
  }
}
