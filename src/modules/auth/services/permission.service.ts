import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPayload } from '../interfaces/user-payload.interface';
import { RolePermissionEntity } from '../../permission/infrastructure/persistence/role-permission.entity';
import { PermissionEntity } from '../../permission/infrastructure/persistence/permission.entity';
import { UserEntity } from '../../user/infrastructure/persistence/user.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Permission Service
 * 
 * Loads user permissions based on their role from the database.
 * Supports SUPER_ADMIN bypass and caching for performance.
 */
@Injectable()
export class PermissionService {
  private permissionCache: Map<string, string[]> = new Map();
  private readonly cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(
    @InjectRepository(RolePermissionEntity, 'master')
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(PermissionEntity, 'master')
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(UserEntity, 'master')
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if user is SUPER_ADMIN
   */
  private isSuperAdmin(userId: string, email?: string, userName?: string): boolean {
    const appConfig = this.configService.get('app');
    const superAdminConfig = appConfig?.superAdmin || {};
    
    // Check by userId
    if (userId === superAdminConfig.userId || 
        userId === '00000000-0000-0000-0000-000000000001') {
      return true;
    }

    // Check by email/username
    const userEmail = (email || userName || '').toLowerCase().trim();
    const superAdminEmail = (superAdminConfig.email || 'superadmin@medi-waste.io').toLowerCase().trim();
    const superAdminUsername = (superAdminConfig.username || 'superadmin').toLowerCase().trim();
    
    return userEmail === superAdminEmail || userEmail === superAdminUsername;
  }

  /**
   * Load permissions for a user based on their role
   * This should be called after successful authentication
   */
  async loadUserPermissions(userId: string, roleId: string | null, email?: string, userName?: string): Promise<string[]> {
    // SUPER_ADMIN gets all permissions
    if (this.isSuperAdmin(userId, email, userName)) {
      return ['*']; // Wildcard means all permissions
    }

    if (!roleId) {
      return [];
    }

    // Check cache first
    const cacheKey = `${userId}:${roleId}`;
    const cached = this.permissionCache.get(cacheKey);
    const cacheTime = this.cacheTimestamps.get(cacheKey);
    
    if (cached && cacheTime && (Date.now() - cacheTime) < this.cacheTTL) {
      return cached;
    }

    try {
      // Load permissions from database
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { roleId },
        relations: ['permission'],
      });

      const permissionCodes = rolePermissions
        .map(rp => rp.permission?.permissionCode)
        .filter((code): code is string => !!code);

      // Cache the permissions
      this.permissionCache.set(cacheKey, permissionCodes);
      this.cacheTimestamps.set(cacheKey, Date.now());
      
      return permissionCodes;
    } catch (error) {
      console.error('Error loading user permissions:', error);
      return [];
    }
  }

  /**
   * Build user payload with permissions for JWT
   */
  async buildUserPayload(
    userId: string,
    companyId: string,
    userName: string,
    roleId?: string | null,
    email?: string,
  ): Promise<UserPayload> {
    const permissions = roleId
      ? await this.loadUserPermissions(userId, roleId, email, userName)
      : [];

    return {
      userId,
      companyId,
      userName,
      permissions,
      roleId: roleId || undefined,
    };
  }

  /**
   * Get all available permissions (for menu configuration)
   */
  async getAllPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      where: { isActive: true },
      order: { moduleName: 'ASC', permissionName: 'ASC' },
    });
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // SUPER_ADMIN has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Clear permission cache for a user (call after role/permission changes)
   */
  clearUserCache(userId: string, roleId?: string): void {
    if (roleId) {
      this.permissionCache.delete(`${userId}:${roleId}`);
    } else {
      // Clear all entries for this user
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.permissionCache.delete(key);
        }
      }
    }
  }
}
