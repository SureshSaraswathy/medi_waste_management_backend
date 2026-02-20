import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../../user/domain/interfaces/user.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../user/domain/interfaces/user.repository.interface';
import { HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IHcfRepository } from '../../../hcf/domain/interfaces/hcf.repository.interface';
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
  userType?: 'USER' | 'HCF'; // NEW: Distinguish user type
  hcfId?: string; // NEW: If HCF user
  status: string;
  requiresOTP: boolean;
  forcePasswordChange?: boolean;
  requiresPasswordChange?: boolean; // NEW: For HCF users
  passwordExpired?: boolean; // NEW: For HCF users
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
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
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
        userType: 'USER',
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

    // If user not found, try HCF login
    if (!user) {
      return this.tryHCFLogin(usernameOrEmail, password);
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

    // OTP control:
    // - Global master switch (OTP_ENABLED) must be enabled.
    // - Per-user flags decide whether OTP is required for that user.
    //   - otpEnabled: user opted into OTP
    //   - forceOtpOnNextLogin: one-time forced OTP (e.g., after admin action)
    const appConfig = this.configService.get('app');
    const otpGloballyEnabled = appConfig?.otp?.enabled || false;
    const userRequiresOtp = Boolean(user.otpEnabled || user.forceOtpOnNextLogin);
    const requiresOTP = otpGloballyEnabled && userRequiresOtp;

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
      userType: 'USER', // Mark as regular user
    };
  }

  /**
   * Try HCF login if user login fails
   */
  private async tryHCFLogin(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    try {
      // Try to find HCF by code or email (case-insensitive)
      const hcf = await this.hcfRepository.findByCodeOrEmail(usernameOrEmail);

      if (!hcf) {
        console.log(`[HCF Login] HCF not found for identifier: ${usernameOrEmail}`);
        throw new UnauthorizedException('Invalid username or password');
      }

      if (!hcf.loginEnabled) {
        console.log(`[HCF Login] Login not enabled for HCF: ${hcf.hcfCode}`);
        throw new UnauthorizedException('Invalid username or password');
      }

      // Check if HCF is active
      if (hcf.status !== 'Active' || hcf.isDeleted) {
        console.log(`[HCF Login] HCF not active or deleted: ${hcf.hcfCode}, status: ${hcf.status}, isDeleted: ${hcf.isDeleted}`);
        throw new UnauthorizedException('Invalid username or password');
      }

      // Check if password hash exists
      if (!hcf.passwordHash) {
        console.error(`[HCF Login] Password hash is missing for HCF: ${hcf.hcfCode}. Login enabled but no password set.`);
        throw new UnauthorizedException('Password not configured. Please contact administrator.');
      }

      // Verify password
      const isPasswordValid = await this.passwordService.comparePassword(
        password,
        hcf.passwordHash,
      );

      // Check temporary password
      let isTemporaryPassword = false;
      if (hcf.temporaryPassword) {
        isTemporaryPassword = password === hcf.temporaryPassword;
        if (isTemporaryPassword && hcf.isTemporaryPasswordExpired()) {
          throw new UnauthorizedException('Temporary password has expired. Please request a new password reset.');
        }
      }

      if (!isPasswordValid && !isTemporaryPassword) {
        console.log(`[HCF Login] Password validation failed for HCF: ${hcf.hcfCode}`);
        throw new UnauthorizedException('Invalid username or password');
      }

      console.log(`[HCF Login] Successful login for HCF: ${hcf.hcfCode}`);

      // Check password expiration
      const isPasswordExpired = hcf.isPasswordExpired();
      const requiresPasswordChange = hcf.forcePasswordChange || isPasswordExpired;

      if (isPasswordExpired && !isTemporaryPassword) {
        throw new UnauthorizedException('Password has expired. Please reset your password.');
      }

      // Update last login
      hcf.lastLogin = new Date();
      await this.hcfRepository.update(hcf.hcfId, hcf);

      // Load HCF permissions
      const permissions = this.getHCFPermissions();

      // Generate JWT token
      const token = await this.jwtService.generateToken({
        userId: hcf.hcfId,
        userName: hcf.hcfCode,
        email: hcf.contactEmail || undefined,
        companyId: hcf.companyId,
        userRoleId: null,
        permissions,
      });

      return {
        userId: hcf.hcfId,
        userName: hcf.hcfCode,
        email: hcf.contactEmail || undefined,
        companyId: hcf.companyId,
        userRoleId: null,
        userType: 'HCF',
        hcfId: hcf.hcfId,
        status: hcf.status,
        requiresOTP: false, // HCF users don't use OTP
        forcePasswordChange: false,
        requiresPasswordChange,
        passwordExpired: isPasswordExpired,
        token,
      };
    } catch (error) {
      // If HCF login fails, log the error and throw
      if (error instanceof UnauthorizedException) {
        // Re-throw the original error (it already has the correct message)
        throw error;
      }
      console.error(`[HCF Login] Unexpected error during HCF login:`, error);
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  /**
   * Get fixed permissions for HCF users
   */
  private getHCFPermissions(): string[] {
    return [
      'HCF_PROFILE_VIEW',
      'HCF_PROFILE_EDIT',
      'HCF_INVOICE_VIEW',
      'HCF_PAYMENT_VIEW',
      'HCF_WASTE_ENTRY_CREATE',
      'HCF_WASTE_ENTRY_VIEW',
    ];
  }
}
