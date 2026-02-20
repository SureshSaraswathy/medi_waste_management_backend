import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IHcfRepository } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { PasswordService } from '../../../user/application/services/password.service';
import { HCFNotFoundException } from '../../domain/exceptions/hcf-auth.exceptions';

@Injectable()
export class ChangeHCFPasswordUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    hcfId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const hcf = await this.hcfRepository.findById(hcfId);

    if (!hcf) {
      throw new HCFNotFoundException(hcfId);
    }

    // Validate new password strength
    const validation = this.passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePassword(
      currentPassword,
      hcf.passwordHash || '',
    );

    // Check temporary password
    let isTemporaryPassword = false;
    if (hcf.temporaryPassword) {
      isTemporaryPassword = currentPassword === hcf.temporaryPassword;
      if (isTemporaryPassword && hcf.isTemporaryPasswordExpired()) {
        throw new BadRequestException('Temporary password has expired. Please request a new password reset.');
      }
    }

    if (!isCurrentPasswordValid && !isTemporaryPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    const passwordExpiresAt = this.calculatePasswordExpiry();

    // Update password
    hcf.setPassword(passwordHash);
    hcf.passwordExpiresAt = passwordExpiresAt;
    hcf.modifiedOn = new Date();

    await this.hcfRepository.update(hcfId, hcf);

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }

  private calculatePasswordExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90); // 90 days default
    return expiry;
  }
}
