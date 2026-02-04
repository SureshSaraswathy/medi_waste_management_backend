import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Request,
  UnauthorizedException,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionService } from '../../auth/services/permission.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../infrastructure/persistence/permission.entity';
import { RolePermissionEntity } from '../infrastructure/persistence/role-permission.entity';
import { RoleEntity } from '../../role/infrastructure/persistence/role.entity';

type ReplaceRolePermissionsBody = {
  permissionCodes: string[];
};

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
  constructor(
    private readonly permissionService: PermissionService,
    @InjectRepository(PermissionEntity, 'master')
    private readonly permissionRepo: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity, 'master')
    private readonly rolePermissionRepo: Repository<RolePermissionEntity>,
    @InjectRepository(RoleEntity, 'master')
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Request() req: any) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Tokens use `userRoleId` in this codebase; keep backward compatibility with `roleId`.
    const roleId: string | null = user.userRoleId ?? user.roleId ?? null;

    // Fallback: reload from DB using existing tables (roles/role_permissions/permissions)
    const permissions = await this.permissionService.loadUserPermissions(
      user.userId,
      roleId,
      user.email,
      user.userName,
    );

    return { success: true, data: permissions, message: 'Permissions retrieved successfully' };
  }

  /**
   * Admin API: list all permissions (flat).
   *
   * Guarded by ROLE_PERMISSIONS_MANAGE (SuperAdmin bypasses via PermissionsGuard).
   * This is additive and does not change existing business logic.
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ROLE_PERMISSIONS_MANAGE')
  @HttpCode(HttpStatus.OK)
  async listAll() {
    const items = await this.permissionRepo.find({
      where: { isActive: true as any },
      order: { moduleName: 'ASC', permissionName: 'ASC' },
    });

    return {
      success: true,
      data: items.map((p) => ({
        permissionId: p.permissionId,
        permissionCode: p.permissionCode,
        permissionName: p.permissionName,
        moduleName: p.moduleName,
        description: p.description,
        isActive: p.isActive,
      })),
      message: 'Permissions retrieved successfully',
    };
  }

  /**
   * Admin API: get permission codes assigned to a role.
   */
  @Get('roles/:roleId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ROLE_PERMISSIONS_MANAGE')
  @HttpCode(HttpStatus.OK)
  async getRolePermissions(@Param('roleId') roleId: string) {
    const role = await this.roleRepo.findOne({ where: { roleId } as any });
    if (!role) throw new NotFoundException('Role not found');

    const links = await this.rolePermissionRepo.find({
      where: { roleId } as any,
      relations: { permission: true } as any,
    });

    const codes = links
      .map((rp) => rp.permission?.permissionCode)
      .filter((x): x is string => typeof x === 'string' && x.length > 0);

    return { success: true, data: codes, message: 'Role permissions retrieved successfully' };
  }

  /**
   * Admin API: replace role permissions using permission_code list.
   *
   * Body: { permissionCodes: string[] }
   * - Empty array clears all permissions for the role.
   */
  @Put('roles/:roleId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ROLE_PERMISSIONS_MANAGE')
  @HttpCode(HttpStatus.OK)
  async replaceRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: ReplaceRolePermissionsBody,
  ) {
    const role = await this.roleRepo.findOne({ where: { roleId } as any });
    if (!role) throw new NotFoundException('Role not found');

    const permissionCodes = Array.isArray(body?.permissionCodes) ? body.permissionCodes : null;
    if (!permissionCodes) {
      throw new BadRequestException('permissionCodes must be an array of permission_code strings');
    }

    const normalized = Array.from(
      new Set(
        permissionCodes
          .map((c) => (typeof c === 'string' ? c.trim() : ''))
          .filter((c) => c.length > 0),
      ),
    );

    // Validate all codes exist (active or inactive; allow mapping anyway)
    if (normalized.length > 0) {
      const found = await this.permissionRepo.find({
        where: normalized.map((permissionCode) => ({ permissionCode })) as any,
      });
      const foundSet = new Set(found.map((p) => p.permissionCode));
      const unknown = normalized.filter((c) => !foundSet.has(c));
      if (unknown.length > 0) {
        throw new BadRequestException(`Unknown permission_code(s): ${unknown.join(', ')}`);
      }

      // Replace mappings
      await this.rolePermissionRepo.delete({ roleId } as any);
      await this.rolePermissionRepo.insert(
        found.map((p) => ({
          roleId,
          permissionId: p.permissionId,
        })) as any,
      );
    } else {
      // Clear mappings
      await this.rolePermissionRepo.delete({ roleId } as any);
    }

    // Clear cached permissions for this role so changes reflect immediately.
    this.permissionService.clearRoleCache(roleId);

    return { success: true, data: normalized, message: 'Role permissions updated successfully' };
  }
}

