import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../../user/domain/interfaces/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../user/domain/interfaces/user.repository.interface';
import { PasswordService } from '../../../user/application/services/password.service';
import { AuthJwtService } from '../../services/jwt.service';
import { PermissionService } from '../../services/permission.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../../user/infrastructure/persistence/user.entity';
import { UserEmployeeProfileEntity } from '../../../user/infrastructure/persistence/user-employee-profile.entity';

export interface LoginResponse {
  userId: string;
  userName: string;
  email?: string;
  companyId: string;
  userRoleId: string | null;
  status: string;
  requiresOTP: boolean;
  forcePasswordChange: boolean;
  token?: string; // JWT token
}

@Injectable()
export class LoginUseCase {
  private readonly superAdminConfig: {
    username: string;
    password: string;
    staticOtp: string;
    userId: string;
    email: string;
  };

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: AuthJwtService,
    private readonly permissionService: PermissionService,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get('app');
    this.superAdminConfig = appConfig?.superAdmin || {
      username: 'superadmin',
      password: 'admin123',
      staticOtp: '123456',
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'superadmin@medi-waste.io',
    };
  }

  async execute(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    // Normalize input
    const normalizedInput = usernameOrEmail.trim().toLowerCase();

    // Check if this is the super admin user
    const isSuperAdmin = 
      normalizedInput === this.superAdminConfig.username.toLowerCase() ||
      normalizedInput === this.superAdminConfig.email.toLowerCase();

    if (isSuperAdmin) {
      // Verify super admin password
      if (password !== this.superAdminConfig.password) {
        throw new UnauthorizedException('Invalid username or password');
      }

      // Super admin: Check if OTP is enabled (can be configured via environment)
      // For now, super admin doesn't have otpEnabled flag, so we check global setting
      const appConfig = this.configService.get('app');
      const otpGloballyEnabled = appConfig?.otp?.enabled || false;

      // Load permissions for super admin (should return ['*'])
      const permissions = await this.permissionService.loadUserPermissions(
        this.superAdminConfig.userId,
        null, // SuperAdmin doesn't have a roleId
        this.superAdminConfig.email,
        this.superAdminConfig.username,
      );

      // Generate JWT token for super admin if OTP not required
      let token: string | undefined;
      if (!otpGloballyEnabled) {
        token = await this.jwtService.generateToken({
          userId: this.superAdminConfig.userId,
          userName: this.superAdminConfig.username,
          email: this.superAdminConfig.email,
          companyId: '00000000-0000-0000-0000-000000000000', // System company ID
          userRoleId: null,
          permissions, // Include permissions in token
        });
      }

      // Return super admin login response
      return {
        userId: this.superAdminConfig.userId,
        userName: this.superAdminConfig.username,
        email: this.superAdminConfig.email,
        companyId: '00000000-0000-0000-0000-000000000000', // System company ID
        userRoleId: null,
        status: 'Active',
        requiresOTP: otpGloballyEnabled, // Super admin uses global setting
        forcePasswordChange: false,
        token, // JWT token or undefined if OTP required
      };
    }

    // Find user by username or email (regular users)
    let user = null;
    let companyId: string | null = null;

    // Try to find by username first (need to search across all companies)
    const userEntity = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('LOWER(user.user_name) = :input', { input: normalizedInput })
      .andWhere('user.is_deleted = false')
      .andWhere('user.status = :status', { status: 'Active' })
      .getOne();

    if (userEntity) {
      companyId = userEntity.companyId;
      user = await this.userRepository.findByUserName(companyId, userEntity.userName);
    } else {
      // Try to find by email
      const profileEntity = await this.dataSource
        .getRepository(UserEmployeeProfileEntity)
        .createQueryBuilder('profile')
        .innerJoin(UserEntity, 'user', 'user.user_id = profile.user_id')
        .where('LOWER(profile.email_address) = :input', { input: normalizedInput })
        .andWhere('profile.is_deleted = false')
        .andWhere('user.is_deleted = false')
        .andWhere('user.status = :status', { status: 'Active' })
        .select(['profile.userId'])
        .getOne();

      if (profileEntity) {
        user = await this.userRepository.findById(profileEntity.userId);
        if (user) {
          companyId = user.companyId;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Check if password is enabled
    if (!user.passwordEnabled || !user.passwordHash) {
      throw new UnauthorizedException('Password authentication is not enabled for this user');
    }

    // Check if user is active
    if (user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.passwordHash,
    );

    // Also check temporary password if exists
    let isTemporaryPassword = false;
    if (user.temporaryPassword) {
      isTemporaryPassword = password === user.temporaryPassword;
      // Check if temporary password is expired
      if (isTemporaryPassword && this.passwordService.isTemporaryPasswordExpired(user.temporaryPasswordExpiry)) {
        throw new UnauthorizedException('Temporary password has expired. Please contact administrator.');
      }
    }

    if (!isPasswordValid && !isTemporaryPassword) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Get email if available
    let email: string | undefined;
    if (user.userId) {
      const profile = await this.dataSource
        .getRepository(UserEmployeeProfileEntity)
        .findOne({
          where: { userId: user.userId, isDeleted: false },
          select: ['emailAddress'],
        });
      email = profile?.emailAddress || undefined;
    }

    // OTP is controlled by a global master switch (OTP_ENABLED).
    // If OTP is enabled globally, require OTP for all users.
    const appConfig = this.configService.get('app');
    const otpGloballyEnabled = appConfig?.otp?.enabled || false;
    const requiresOTP = otpGloballyEnabled;

    // If OTP is required, we must have an email to deliver the OTP.
    if (requiresOTP && !email) {
      throw new UnauthorizedException('Email address not found for this user. Please contact administrator.');
    }

    // Load user permissions
    const permissions = await this.permissionService.loadUserPermissions(
      user.userId,
      user.userRoleId || null,
      email,
      user.userName,
    );

    // Generate JWT token if OTP not required
    let token: string | undefined;
    if (!requiresOTP) {
      token = await this.jwtService.generateToken({
        userId: user.userId,
        userName: user.userName,
        email,
        companyId: user.companyId,
        userRoleId: user.userRoleId || null,
        permissions,
      });
    }

    return {
      userId: user.userId,
      userName: user.userName,
      email,
      companyId: user.companyId,
      userRoleId: user.userRoleId || null,
      status: user.status,
      requiresOTP,
      forcePasswordChange: user.forcePasswordChange || false,
      token, // JWT token or undefined if OTP required
    };
  }
}
