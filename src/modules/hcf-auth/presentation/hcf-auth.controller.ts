import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { HCFLoginDto } from '../application/dto/hcf-login.dto';
import { RequestHCFPasswordResetDto } from '../application/dto/request-hcf-password-reset.dto';
import { ResetHCFPasswordWithTokenDto } from '../application/dto/reset-hcf-password-with-token.dto';
import { ChangeHCFPasswordDto } from '../application/dto/change-hcf-password.dto';
import { HCFLoginUseCase } from '../application/use-cases/hcf-login.use-case';
import { AdminResetHCFPasswordUseCase } from '../application/use-cases/admin-reset-hcf-password.use-case';
import { RequestHCFPasswordResetUseCase } from '../application/use-cases/request-hcf-password-reset.use-case';
import { ResetHCFPasswordWithTokenUseCase } from '../application/use-cases/reset-hcf-password-with-token.use-case';
import { ChangeHCFPasswordUseCase } from '../application/use-cases/change-hcf-password.use-case';

@Controller('hcf-auth')
export class HCFAuthController {
  constructor(
    private readonly hcfLoginUseCase: HCFLoginUseCase,
    private readonly adminResetPasswordUseCase: AdminResetHCFPasswordUseCase,
    private readonly requestPasswordResetUseCase: RequestHCFPasswordResetUseCase,
    private readonly resetPasswordWithTokenUseCase: ResetHCFPasswordWithTokenUseCase,
    private readonly changePasswordUseCase: ChangeHCFPasswordUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: HCFLoginDto) {
    try {
      const result = await this.hcfLoginUseCase.execute(
        loginDto.hcfCode,
        loginDto.password,
      );

      return {
        success: true,
        data: result,
        message: 'HCF login successful',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestHCFPasswordResetDto) {
    try {
      const result = await this.requestPasswordResetUseCase.execute(dto.identifier);
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPasswordWithToken(@Body() dto: ResetHCFPasswordWithTokenDto) {
    try {
      const result = await this.resetPasswordWithTokenUseCase.execute(
        dto.token,
        dto.newPassword,
      );
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() dto: ChangeHCFPasswordDto) {
    try {
      // Extract hcfId from JWT token (assuming it's stored as userId for HCF users)
      const hcfId = req.user?.userId;
      if (!hcfId) {
        throw new Error('HCF ID not found in token');
      }

      const result = await this.changePasswordUseCase.execute(
        hcfId,
        dto.currentPassword,
        dto.newPassword,
      );
      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('admin/reset-password/:hcfId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('HCF_EDIT')
  @HttpCode(HttpStatus.OK)
  async adminResetPassword(@Param('hcfId') hcfId: string, @Request() req: any) {
    try {
      const result = await this.adminResetPasswordUseCase.execute(
        hcfId,
        req.user?.userId,
      );
      return {
        success: true,
        data: result,
        message: 'Password reset successfully. Temporary password sent to HCF contact email.',
      };
    } catch (error) {
      throw error;
    }
  }
}
