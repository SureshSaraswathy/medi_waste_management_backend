import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, NotFoundException, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LoginDto } from '../application/dto/login.dto';
import { VerifyOtpDto } from '../application/dto/verify-otp.dto';
import { SendOtpDto } from '../application/dto/send-otp.dto';
import { LoginUseCase, LoginResponse } from '../application/use-cases/login.use-case';
import { EmailService } from '../services/email.service';
import { OtpService } from '../services/otp.service';
import { AuthJwtService } from '../services/jwt.service';
import { PermissionService } from '../services/permission.service';
import { UserEntity } from '../../user/infrastructure/persistence/user.entity';
import { UserEmployeeProfileEntity } from '../../user/infrastructure/persistence/user-employee-profile.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly superAdminConfig: {
    username: string;
    password: string;
    staticOtp: string;
    userId: string;
    email: string;
  };

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly jwtService: AuthJwtService,
    private readonly permissionService: PermissionService,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.loginUseCase.execute(
        loginDto.usernameOrEmail,
        loginDto.password,
      );

      return {
        success: true,
        data: result,
        message: 'Login successful',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    try {
      const appConfig = this.configService.get('app');
      const otpGloballyEnabled = appConfig?.otp?.enabled || false;
      if (!otpGloballyEnabled) {
        throw new BadRequestException('OTP is disabled (OTP_ENABLED=false)');
      }

      const normalizedInput = sendOtpDto.usernameOrEmail.trim().toLowerCase();
      const isSuperAdmin = 
        normalizedInput === this.superAdminConfig.username.toLowerCase() ||
        normalizedInput === this.superAdminConfig.email.toLowerCase();

      if (isSuperAdmin) {
        // Super admin uses static OTP - no need to send email
        return {
          success: true,
          data: {
            message: 'Please use the configured static OTP',
            otp: this.superAdminConfig.staticOtp, // Return static OTP for super admin
          },
          message: 'Super admin OTP',
        };
      }

      // Find user by username or email
      let user: UserEntity | null = null;
      let userEmail: string | null = null;
      let userName: string | null = null;

      // Try to find by username
      user = await this.dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .where('LOWER(user.user_name) = :input', { input: normalizedInput })
        .andWhere('user.is_deleted = false')
        .andWhere('user.status = :status', { status: 'Active' })
        .getOne();

      if (user) {
        userName = user.userName;
        // Get email from profile
        const profile = await this.dataSource
          .getRepository(UserEmployeeProfileEntity)
          .findOne({
            where: { userId: user.userId, isDeleted: false },
            select: ['emailAddress'],
          });
        userEmail = profile?.emailAddress || null;
      } else {
        // Try to find by email
        const profile = await this.dataSource
          .getRepository(UserEmployeeProfileEntity)
          .createQueryBuilder('profile')
          .innerJoin(UserEntity, 'user', 'user.user_id = profile.user_id')
          .where('LOWER(profile.email_address) = :input', { input: normalizedInput })
          .andWhere('profile.is_deleted = false')
          .andWhere('user.is_deleted = false')
          .andWhere('user.status = :status', { status: 'Active' })
          .select(['profile.userId', 'profile.emailAddress'])
          .getOne();

        if (profile) {
          user = await this.dataSource
            .getRepository(UserEntity)
            .findOne({
              where: { userId: profile.userId, isDeleted: false },
            });
          userEmail = profile.emailAddress || null;
          userName = user?.userName || null;
        }
      }

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!userEmail) {
        throw new NotFoundException('Email address not found for this user. Please contact administrator.');
      }

      // Generate and store OTP
      const otp = this.otpService.generateOTP();
      this.otpService.storeOTP(normalizedInput, otp);

      // Send OTP via email
      const emailSent = await this.emailService.sendOTPEmail(userEmail, otp, userName || undefined);

      if (!emailSent) {
        // Do not log OTP values.
        console.warn(`[OTP] Email sending failed for ${userEmail}`);
      }

      return {
        success: true,
        data: {
          message: emailSent 
            ? 'OTP has been sent to your email address' 
            : 'OTP generated (email sending disabled or failed)',
          email: userEmail,
        },
        message: 'OTP sent successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      const appConfig = this.configService.get('app');
      const otpGloballyEnabled = appConfig?.otp?.enabled || false;
      if (!otpGloballyEnabled) {
        throw new BadRequestException('OTP is disabled (OTP_ENABLED=false)');
      }

      const normalizedInput = verifyOtpDto.usernameOrEmail.trim().toLowerCase();
      const isSuperAdmin = 
        normalizedInput === this.superAdminConfig.username.toLowerCase() ||
        normalizedInput === this.superAdminConfig.email.toLowerCase();

      if (isSuperAdmin) {
        // Verify super admin static OTP
        if (verifyOtpDto.otp !== this.superAdminConfig.staticOtp) {
          throw new UnauthorizedException('Invalid OTP');
        }

        // Generate JWT token for super admin
        const token = await this.jwtService.generateToken({
          userId: this.superAdminConfig.userId,
          userName: this.superAdminConfig.username,
          email: this.superAdminConfig.email,
          companyId: '00000000-0000-0000-0000-000000000000',
          userRoleId: null,
        });

        // Return super admin user data
        const result: LoginResponse = {
          userId: this.superAdminConfig.userId,
          userName: this.superAdminConfig.username,
          email: this.superAdminConfig.email,
          companyId: '00000000-0000-0000-0000-000000000000',
          userRoleId: null,
          status: 'Active',
          requiresOTP: false,
          forcePasswordChange: false,
          token,
        };

        return {
          success: true,
          data: result,
          message: 'OTP verified successfully',
        };
      }

      // Verify OTP for regular users
      const verification = this.otpService.verifyOTP(normalizedInput, verifyOtpDto.otp);
      
      if (!verification.valid) {
        throw new UnauthorizedException(verification.message || 'Invalid OTP');
      }

      // Find user and return login response
      let user: UserEntity | null = null;
      let userEmail: string | null = null;

      user = await this.dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .where('LOWER(user.user_name) = :input', { input: normalizedInput })
        .andWhere('user.is_deleted = false')
        .andWhere('user.status = :status', { status: 'Active' })
        .getOne();

      if (!user) {
        const profile = await this.dataSource
          .getRepository(UserEmployeeProfileEntity)
          .createQueryBuilder('profile')
          .innerJoin(UserEntity, 'user', 'user.user_id = profile.user_id')
          .where('LOWER(profile.email_address) = :input', { input: normalizedInput })
          .andWhere('profile.is_deleted = false')
          .andWhere('user.is_deleted = false')
          .andWhere('user.status = :status', { status: 'Active' })
          .select(['profile.userId', 'profile.emailAddress'])
          .getOne();

        if (profile) {
          user = await this.dataSource
            .getRepository(UserEntity)
            .findOne({
              where: { userId: profile.userId, isDeleted: false },
            });
          userEmail = profile.emailAddress || null;
        }
      } else {
        const profile = await this.dataSource
          .getRepository(UserEmployeeProfileEntity)
          .findOne({
            where: { userId: user.userId, isDeleted: false },
            select: ['emailAddress'],
          });
        userEmail = profile?.emailAddress || null;
      }

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Load user permissions
      const permissions = await this.permissionService.loadUserPermissions(
        user.userId,
        user.userRoleId || null,
        userEmail || undefined,
        user.userName,
      );

      // Generate JWT token
      const token = await this.jwtService.generateToken({
        userId: user.userId,
        userName: user.userName,
        email: userEmail || undefined,
        companyId: user.companyId,
        userRoleId: user.userRoleId || null,
        permissions,
      });

      const result: LoginResponse = {
        userId: user.userId,
        userName: user.userName,
        email: userEmail || undefined,
        companyId: user.companyId,
        userRoleId: user.userRoleId || null,
        status: user.status,
        requiresOTP: false,
        forcePasswordChange: user.forcePasswordChange || false,
        token,
      };

      return {
        success: true,
        data: result,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserPermissions(@Request() req: any) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      // Tokens in this codebase use `userRoleId` in the JWT payload.
      // Some older payloads may use `roleId`, so we support both.
      const roleId: string | null = user.userRoleId ?? user.roleId ?? null;

      // Load permissions for the user
      const permissions = await this.permissionService.loadUserPermissions(
        user.userId,
        roleId,
        user.email,
        user.userName,
      );

      return {
        success: true,
        data: {
          userId: user.userId,
          permissions,
          isSuperAdmin: permissions.includes('*'),
        },
        message: 'Permissions retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('menu-config')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMenuConfig(@Request() req: any) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const roleId: string | null = user.userRoleId ?? user.roleId ?? null;

      // Load permissions for the user
      const permissions = await this.permissionService.loadUserPermissions(
        user.userId,
        roleId,
        user.email,
        user.userName,
      );

      const isSuperAdmin = permissions.includes('*');

      // Menu configuration with permission requirements
      // IMPORTANT:
      // - This endpoint is UI-focused (what to show in the sidebar).
      // - It must NOT "over-allow" based on broad substring matches (e.g. p.includes('_VIEW')),
      //   because that makes menus appear even when role_permissions is empty.
      // - We compute visibility from explicit permission codes only.
      const has = (code: string) => isSuperAdmin || permissions.includes(code);
      const hasAny = (codes: string[]) => isSuperAdmin || codes.some((c) => permissions.includes(c));

      const menuConfig = {
        dashboard: {
          // Always allow dashboard shell for any authenticated user (landing page).
          // Widgets/APIs remain protected by their own guards.
          visible: true,
          permission: 'DASHBOARD_VIEW',
        },
        transaction: {
          visible: hasAny([
            'MENU_TRANSACTION_VIEW',
            'ROUTE_ASSIGNMENT_VIEW',
            'BARCODE_LABEL_VIEW',
            'WASTE_COLLECTION_VIEW',
            'WASTE_TRANSACTION_VIEW',
            'VEHICLE_WASTE_COLLECTION_VIEW',
            'WASTE_PROCESS_VIEW',
          ]),
          permission: 'MENU_TRANSACTION_VIEW',
        },
        finance: {
          visible: hasAny(['FINANCE_VIEW', 'MENU_FINANCE_VIEW', 'INVOICE_VIEW']),
          permission: 'FINANCE_VIEW',
        },
        commercialAgreements: {
          visible: hasAny(['MENU_COMMERCIAL_VIEW', 'CONTRACT_VIEW', 'AGREEMENT_VIEW', 'AGREEMENT_CLAUSE_VIEW']),
          permission: 'MENU_COMMERCIAL_VIEW',
        },
        complianceTraining: {
          visible: hasAny(['MENU_COMPLIANCE_VIEW', 'TRAINING_CERTIFICATE_VIEW']),
          permission: 'MENU_COMPLIANCE_VIEW',
        },
        master: {
          visible: hasAny([
            'MENU_MASTER_VIEW',
            'COMPANY_VIEW',
            'STATE_VIEW',
            'AREA_VIEW',
            'CATEGORY_VIEW',
            'COLOR_VIEW',
            'PCB_ZONE_VIEW',
            'FREQUENCY_VIEW',
            'HCF_TYPE_VIEW',
            'HCF_VIEW',
            'ROUTE_VIEW',
            'FLEET_VIEW',
            'ROUTE_HCF_VIEW',
            'USER_VIEW',
            'ROLE_VIEW',
          ]),
          permission: 'MENU_MASTER_VIEW',
          submenus: {
            company: {
              visible: has('COMPANY_VIEW'),
              permission: 'COMPANY_VIEW',
            },
            state: {
              visible: has('STATE_VIEW'),
              permission: 'STATE_VIEW',
            },
            area: {
              visible: has('AREA_VIEW'),
              permission: 'AREA_VIEW',
            },
            category: {
              visible: has('CATEGORY_VIEW'),
              permission: 'CATEGORY_VIEW',
            },
            color: {
              visible: has('COLOR_VIEW'),
              permission: 'COLOR_VIEW',
            },
            pcbZone: {
              visible: has('PCB_ZONE_VIEW'),
              permission: 'PCB_ZONE_VIEW',
            },
            frequency: {
              visible: has('FREQUENCY_VIEW'),
              permission: 'FREQUENCY_VIEW',
            },
            hcfType: {
              visible: has('HCF_TYPE_VIEW'),
              permission: 'HCF_TYPE_VIEW',
            },
            hcf: {
              visible: has('HCF_VIEW'),
              permission: 'HCF_VIEW',
            },
            route: {
              visible: has('ROUTE_VIEW'),
              permission: 'ROUTE_VIEW',
            },
            fleet: {
              visible: has('FLEET_VIEW'),
              permission: 'FLEET_VIEW',
            },
            routeHcfMapping: {
              visible: has('ROUTE_HCF_VIEW'),
              permission: 'ROUTE_HCF_VIEW',
            },
          },
        },
        report: {
          visible: hasAny(['MENU_REPORTS_VIEW', 'REPORTS_VIEW']),
          permission: 'MENU_REPORTS_VIEW',
        },
      };

      return {
        success: true,
        data: menuConfig,
        message: 'Menu configuration retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
