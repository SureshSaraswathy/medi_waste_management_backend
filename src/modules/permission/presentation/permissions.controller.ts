import { Controller, Get, HttpCode, HttpStatus, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionService } from '../../auth/services/permission.service';

/**
 * Permissions (current-user) API
 *
 * Returns a flat list of permission_code strings for the logged-in user.
 * Convention:
 * - Prefer permission_code values in the format: <FEATURE>.<ACTION>
 *   Examples: INVOICE.VIEW, INVOICE.CREATE, INVOICE.APPROVE, DASHBOARD_CONFIG.VIEW
 *
 * Note: We keep backward compatibility with existing underscore codes (e.g. INVOICE_VIEW).
 */
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Request() req: any) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Prefer permissions already present in JWT payload if available.
    const fromToken: string[] | undefined = Array.isArray(user.permissions) ? user.permissions : undefined;
    if (fromToken) {
      return { success: true, data: fromToken, message: 'Permissions retrieved successfully' };
    }

    // Fallback: reload from DB using existing tables (roles/role_permissions/permissions)
    const permissions = await this.permissionService.loadUserPermissions(
      user.userId,
      user.roleId || null,
      user.email,
      user.userName,
    );

    return { success: true, data: permissions, message: 'Permissions retrieved successfully' };
  }
}

