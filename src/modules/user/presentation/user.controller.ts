import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { UserEmployeeProfileEntity } from '../infrastructure/persistence/user-employee-profile.entity';
import { UserIdentityComplianceEntity } from '../infrastructure/persistence/user-identity-compliance.entity';
import { UserAddressEntity } from '../infrastructure/persistence/user-address.entity';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { CreateCompleteUserUseCase } from '../application/use-cases/create-complete-user.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { GetUserByUsernameUseCase } from '../application/use-cases/get-user-by-username.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { UpdateCompleteUserUseCase } from '../application/use-cases/update-complete-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { ActivateUserUseCase } from '../application/use-cases/activate-user.use-case';
import { ActivateUserWithPasswordUseCase } from '../application/use-cases/activate-user-with-password.use-case';
import { DeactivateUserUseCase } from '../application/use-cases/deactivate-user.use-case';
import { GetUsersByCompanyUseCase } from '../application/use-cases/get-users-by-company.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { AdminResetPasswordUseCase } from '../application/use-cases/admin-reset-password.use-case';
import { CreateUserDto } from '../application/dto/create-user.dto';
import { CreateCompleteUserDto } from '../application/dto/create-complete-user.dto';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { UpdateCompleteUserDto } from '../application/dto/update-complete-user.dto';
import { ActivateUserDto } from '../application/dto/activate-user.dto';
import { ActivateUserWithPasswordDto } from '../application/dto/activate-user-with-password.dto';
import { ChangePasswordDto } from '../application/dto/change-password.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

/**
 * User Controller - Presentation Layer
 * Handles HTTP requests and delegates to use cases
 */
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createCompleteUserUseCase: CreateCompleteUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUserByUsernameUseCase: GetUserByUsernameUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateCompleteUserUseCase: UpdateCompleteUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly activateUserWithPasswordUseCase: ActivateUserWithPasswordUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly getUsersByCompanyUseCase: GetUsersByCompanyUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly adminResetPasswordUseCase: AdminResetPasswordUseCase,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
  ) {}

  @Post('complete')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('USER_CREATE')
  async createComplete(@Body() createCompleteUserDto: CreateCompleteUserDto, @Request() req: any) {
    try {
      console.log('[UserController] createComplete called');
      console.log('[UserController] DTO received:', JSON.stringify(createCompleteUserDto, null, 2));
      console.log('[UserController] Email:', createCompleteUserDto.emailAddress);
      console.log('[UserController] Aadhaar:', createCompleteUserDto.aadhaarNumber);
      console.log('[UserController] PAN:', createCompleteUserDto.panNumber);
      console.log('[UserController] ESI:', createCompleteUserDto.esiNumber);
      console.log('[UserController] Address:', createCompleteUserDto.addressLine);
      
      const user = await this.createCompleteUserUseCase.execute(
        createCompleteUserDto,
        req.user?.userId,
      );
      
      console.log('[UserController] User created successfully:', user.userId);
      return {
        success: true,
        data: {
          userId: user.userId,
          companyId: user.companyId,
          userName: user.userName,
          mobileNumber: user.mobileNumber,
          employeeCode: user.employeeCode,
          userRoleId: user.userRoleId,
          status: user.status,
          passwordEnabled: user.passwordEnabled,
          otpEnabled: user.otpEnabled,
          webLogin: user.webLogin,
          mobileAppAccess: user.mobileAppAccess,
          createdOn: user.createdOn.toISOString(),
          modifiedOn: user.modifiedOn.toISOString(),
        },
        message: 'User created successfully with all details',
      };
    } catch (error) {
      console.error('Error creating complete user:', error);
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('USER_CREATE')
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    try {
      const user = await this.createUserUseCase.execute(createUserDto);
      return {
        success: true,
        data: {
          userId: user.userId,
          companyId: user.companyId,
          userName: user.userName,
          mobileNumber: user.mobileNumber,
          employeeCode: user.employeeCode,
          userRoleId: user.userRoleId,
          status: user.status,
          passwordEnabled: user.passwordEnabled,
          otpEnabled: user.otpEnabled,
          webLogin: user.webLogin,
          mobileAppAccess: user.mobileAppAccess,
          createdOn: user.createdOn.toISOString(),
          modifiedOn: user.modifiedOn.toISOString(),
        },
        message: 'User created successfully',
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get()
  @RequirePermissions('USER_VIEW')
  async findAll(@Query('companyId') companyId?: string) {
    if (!companyId) {
      return {
        success: false,
        data: [],
        message: 'companyId query parameter is required. Use /users/company/:companyId to get users by company.',
      };
    }
    // Delegate to the existing findAllByCompany method
    const users = await this.getUsersByCompanyUseCase.execute(companyId);
    
    // Get employee profile data for all users in a single query
    const userIds = users.map(u => u.userId);
    const profiles = userIds.length > 0 ? await this.dataSource
      .getRepository(UserEmployeeProfileEntity)
      .find({
        where: { userId: In(userIds), isDeleted: false },
        select: ['userId', 'emailAddress', 'employmentType'],
      }) : [];
    
    const emailMap = new Map(profiles.map(p => [p.userId, p.emailAddress]));
    const employmentTypeMap = new Map(profiles.map(p => [p.userId, p.employmentType]));
    
    return {
      success: true,
      data: users.map((user) => ({
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        emailAddress: emailMap.get(user.userId) || null,
        employmentType: employmentTypeMap.get(user.userId) || null,
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      })),
      message: 'Users retrieved successfully',
    };
  }

  @Get('username/:userName')
  @RequirePermissions('USER_VIEW')
  async findByUsername(@Param('userName') userName: string) {
    const userData = await this.getUserByUsernameUseCase.execute(userName);
    return {
      success: true,
      data: userData,
      message: 'User retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('USER_VIEW')
  async findOne(@Param('id') id: string) {
    const user = await this.getUserUseCase.execute(id);
    
    // Fetch related data from all related entities
    const employeeProfile = await this.dataSource
      .getRepository(UserEmployeeProfileEntity)
      .findOne({
        where: { userId: id, isDeleted: false },
      });
    
    const identityCompliance = await this.dataSource
      .getRepository(UserIdentityComplianceEntity)
      .findOne({
        where: { userId: id, isDeleted: false },
      });
    
    const address = await this.dataSource
      .getRepository(UserAddressEntity)
      .findOne({
        where: { userId: id, isDeleted: false },
      });
    
    return {
      success: true,
      data: {
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        // Employee Profile data
        emailAddress: employeeProfile?.emailAddress || null,
        employmentType: employeeProfile?.employmentType || null,
        designation: employeeProfile?.designation || null,
        contractorName: employeeProfile?.contractorName || null,
        companyNameThirdParty: employeeProfile?.companyNameThirdParty || null,
        grossSalary: employeeProfile?.grossSalary ? Number(employeeProfile.grossSalary) : null,
        // Identity & Compliance data
        aadhaarNumber: identityCompliance?.aadhaarNumber || null,
        panNumber: identityCompliance?.panNumber || null,
        drivingLicenseNumber: identityCompliance?.drivingLicenseNumber || null,
        pfNumber: identityCompliance?.pfNumber || null,
        uanNumber: identityCompliance?.uanNumber || null,
        esiNumber: identityCompliance?.esiNumber || null,
        // Address data
        addressLine: address?.addressLine || null,
        area: address?.area || null,
        city: address?.city || null,
        district: address?.district || null,
        pincode: address?.pincode || null,
        emergencyContact: address?.emergencyContact || null,
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      },
      message: 'User retrieved successfully with all related data',
    };
  }

  @Put(':id/complete')
  @RequirePermissions('USER_EDIT')
  async updateComplete(
    @Param('id') id: string,
    @Body() updateCompleteUserDto: UpdateCompleteUserDto,
    @Request() req: any,
  ) {
    console.log('[UserController] updateComplete called');
    console.log('[UserController] User ID:', id);
    console.log('[UserController] DTO received:', JSON.stringify(updateCompleteUserDto, null, 2));
    console.log('[UserController] Email:', updateCompleteUserDto.emailAddress);
    console.log('[UserController] Aadhaar:', updateCompleteUserDto.aadhaarNumber);
    console.log('[UserController] PAN:', updateCompleteUserDto.panNumber);
    console.log('[UserController] ESI:', updateCompleteUserDto.esiNumber);
    console.log('[UserController] Address:', updateCompleteUserDto.addressLine);

    const user = await this.updateCompleteUserUseCase.execute(
      id,
      updateCompleteUserDto,
      req.user?.userId,
    );
    
    return {
      success: true,
      data: {
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      },
      message: 'User updated successfully with all related data',
    };
  }

  @Put(':id')
  @RequirePermissions('USER_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    const user = await this.updateUserUseCase.execute(id, updateUserDto);
    return {
      success: true,
      data: {
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      },
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('USER_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteUserUseCase.execute(id);
  }

  @Post(':id/activate')
  @RequirePermissions('USER_ACTIVATE')
  async activate(
    @Param('id') id: string,
    @Body() activateUserDto: ActivateUserDto,
    @Request() req: any,
  ) {
    const user = await this.activateUserUseCase.execute(id, activateUserDto, req.user?.userId);
    const message = user.status === 'Active' && user.modifiedOn.getTime() - Date.now() < 2000
      ? 'User activation settings updated successfully'
      : 'User activated successfully';
    
    return {
      success: true,
      data: {
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      },
      message,
    };
  }

  @Post(':id/deactivate')
  @RequirePermissions('USER_DEACTIVATE')
  async deactivate(@Param('id') id: string) {
    const user = await this.deactivateUserUseCase.execute(id);
    return {
      success: true,
      data: {
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      },
      message: 'User deactivated successfully',
    };
  }

  @Post(':id/activate-with-password')
  @RequirePermissions('USER_ACTIVATE')
  async activateWithPassword(
    @Param('id') id: string,
    @Body() activateUserDto: ActivateUserWithPasswordDto,
    @Request() req: any,
  ) {
    const result = await this.activateUserWithPasswordUseCase.execute(
      id,
      activateUserDto,
      req.user?.userId,
    );
    
    return {
      success: true,
      data: {
        userId: result.user.userId,
        companyId: result.user.companyId,
        userName: result.user.userName,
        mobileNumber: result.user.mobileNumber,
        employeeCode: result.user.employeeCode,
        userRoleId: result.user.userRoleId,
        status: result.user.status,
        passwordEnabled: result.user.passwordEnabled,
        otpEnabled: result.user.otpEnabled,
        webLogin: result.user.webLogin,
        mobileAppAccess: result.user.mobileAppAccess,
        forcePasswordChange: result.user.forcePasswordChange,
        temporaryPassword: result.temporaryPassword, // Return plain text password (shown once)
        temporaryPasswordExpiry: result.user.temporaryPasswordExpiry?.toISOString() || null,
        createdOn: result.user.createdOn.toISOString(),
        modifiedOn: result.user.modifiedOn.toISOString(),
      },
      message: 'User activated successfully with temporary password',
    };
  }

  @Post(':id/reset-password')
  @RequirePermissions('USER_EDIT')
  async resetPassword(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const result = await this.adminResetPasswordUseCase.execute(id, req.user?.userId);
    
    return {
      success: true,
      data: {
        userId: result.user.userId,
        userName: result.user.userName,
        temporaryPassword: result.temporaryPassword, // Return plain text password (shown once)
        temporaryPasswordExpiry: result.user.temporaryPasswordExpiry?.toISOString() || null,
        forcePasswordChange: result.user.forcePasswordChange,
      },
      message: 'Password reset successfully. User must change password on next login.',
    };
  }

  @Post(':id/change-password')
  @RequirePermissions('USER_EDIT')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ) {
    const user = await this.changePasswordUseCase.execute(id, changePasswordDto, req.user?.userId);
    
    return {
      success: true,
      data: {
        userId: user.userId,
        userName: user.userName,
        forcePasswordChange: user.forcePasswordChange,
      },
      message: 'Password changed successfully',
    };
  }

  @Get('company/:companyId')
  @RequirePermissions('USER_VIEW')
  async findAllByCompany(@Param('companyId') companyId: string) {
    const users = await this.getUsersByCompanyUseCase.execute(companyId);
    
    // Get employee profile data for all users in a single query
    const userIds = users.map(u => u.userId);
    const profiles = userIds.length > 0 ? await this.dataSource
      .getRepository(UserEmployeeProfileEntity)
      .find({
        where: { userId: In(userIds), isDeleted: false },
        select: ['userId', 'emailAddress', 'employmentType'],
      }) : [];
    
    const emailMap = new Map(profiles.map(p => [p.userId, p.emailAddress]));
    const employmentTypeMap = new Map(profiles.map(p => [p.userId, p.employmentType]));
    
    return {
      success: true,
      data: users.map((user) => ({
        userId: user.userId,
        companyId: user.companyId,
        userName: user.userName,
        mobileNumber: user.mobileNumber,
        employeeCode: user.employeeCode,
        userRoleId: user.userRoleId,
        status: user.status,
        passwordEnabled: user.passwordEnabled,
        otpEnabled: user.otpEnabled,
        webLogin: user.webLogin,
        mobileAppAccess: user.mobileAppAccess,
        emailAddress: emailMap.get(user.userId) || null, // Include email address
        employmentType: employmentTypeMap.get(user.userId) || null, // Include employment type
        createdOn: user.createdOn.toISOString(),
        modifiedOn: user.modifiedOn.toISOString(),
      })),
      message: 'Users retrieved successfully',
    };
  }
}
