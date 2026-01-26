import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  /**
   * Check if user is SUPER_ADMIN
   * SUPER_ADMIN bypasses all permission checks
   */
  private isSuperAdmin(user: any): boolean {
    if (!user) return false;

    const appConfig = this.configService.get('app');
    const superAdminConfig = appConfig?.superAdmin || {};
    
    // Check by userId
    if (user.userId === superAdminConfig.userId || 
        user.userId === '00000000-0000-0000-0000-000000000001') {
      return true;
    }

    // Check by email/username (case-insensitive)
    const userEmail = (user.email || user.userName || '').toLowerCase().trim();
    const superAdminEmail = (superAdminConfig.email || 'superadmin@medi-waste.io').toLowerCase().trim();
    const superAdminUsername = (superAdminConfig.username || 'superadmin').toLowerCase().trim();
    
    if (userEmail === superAdminEmail || userEmail === superAdminUsername) {
      return true;
    }

    // Check by role name in permissions array (if present)
    if (user.roles && Array.isArray(user.roles)) {
      if (user.roles.includes('superadmin') || user.roles.includes('SUPER_ADMIN')) {
        return true;
      }
    }

    return false;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No permissions required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN bypass - check first before any permission validation
    if (this.isSuperAdmin(user)) {
      return true;
    }
    
    // Get user permissions from JWT or session
    const userPermissions: string[] = user.permissions || [];

    // Check if user has wildcard permission (SUPER_ADMIN)
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Unauthorized: Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
