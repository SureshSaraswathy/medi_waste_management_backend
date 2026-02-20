import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IHcfRepository } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { PasswordService } from '../../../user/application/services/password.service';
import { HCFTokenService } from '../services/hcf-token.service';
import { InvalidResetTokenException } from '../../domain/exceptions/hcf-auth.exceptions';

@Injectable()
export class ResetHCFPasswordWithTokenUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: HCFTokenService,
  ) {}

  async execute(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Find HCF by reset token
    const hcf = await this.hcfRepository.findByResetToken(token);

    if (!hcf) {
      throw new InvalidResetTokenException();
    }

    // Check token expiry
    if (hcf.isResetTokenExpired()) {
      throw new InvalidResetTokenException();
    }

    // Validate password strength
    const validation = this.passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    const passwordExpiresAt = this.calculatePasswordExpiry(); // 90 days default

    // Update HCF password
    hcf.passwordHash = passwordHash;
    hcf.forcePasswordChange = false;
    hcf.temporaryPassword = null;
    hcf.temporaryPasswordExpiry = null;
    hcf.resetToken = null;
    hcf.resetTokenExpiry = null;
    hcf.passwordChangedAt = new Date();
    hcf.passwordExpiresAt = passwordExpiresAt;
    hcf.modifiedOn = new Date();

    await this.hcfRepository.update(hcf.hcfId, hcf);

    return {
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  private calculatePasswordExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90); // 90 days default
    return expiry;
  }
}
