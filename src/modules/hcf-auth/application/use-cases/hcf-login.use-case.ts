import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IHcfRepository } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { PasswordService } from '../../../user/application/services/password.service';
import { AuthJwtService } from '../../../auth/services/jwt.service';
import { PermissionService } from '../../../auth/services/permission.service';
import { HCFLoginResponse } from '../dto/hcf-login-response.dto';
import {
  HCFLoginNotEnabledException,
  InvalidHCFCredentialsException,
  HCFPasswordExpiredException,
} from '../../domain/exceptions/hcf-auth.exceptions';

@Injectable()
export class HCFLoginUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: AuthJwtService,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(hcfCode: string, password: string): Promise<HCFLoginResponse> {
    // Find HCF by code
    const hcf = await this.hcfRepository.findByCode(hcfCode);

    if (!hcf) {
      throw new InvalidHCFCredentialsException();
    }

    // Check if login is enabled
    if (!hcf.loginEnabled) {
      throw new HCFLoginNotEnabledException(hcfCode);
    }

    // Check if HCF is active
    if (hcf.status !== 'Active' || hcf.isDeleted) {
      throw new InvalidHCFCredentialsException();
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      hcf.passwordHash || '',
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
      throw new InvalidHCFCredentialsException();
    }

    // Check password expiration
    const isPasswordExpired = hcf.isPasswordExpired();
    const requiresPasswordChange = hcf.forcePasswordChange || isPasswordExpired;

    if (isPasswordExpired && !isTemporaryPassword) {
      throw new HCFPasswordExpiredException();
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
      status: hcf.status,
      requiresPasswordChange,
      passwordExpired: isPasswordExpired,
      token,
    };
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
