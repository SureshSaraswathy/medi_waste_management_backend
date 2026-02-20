import { Injectable, Inject } from '@nestjs/common';
import { HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IHcfRepository } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { PasswordService } from '../../../user/application/services/password.service';
import { EmailService } from '../../../auth/services/email.service';
import { HCFNotFoundException } from '../../domain/exceptions/hcf-auth.exceptions';

@Injectable()
export class AdminResetHCFPasswordUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  async execute(hcfId: string, modifiedBy?: string): Promise<{ hcfId: string; temporaryPassword: string }> {
    const hcf = await this.hcfRepository.findById(hcfId);

    if (!hcf) {
      throw new HCFNotFoundException(hcfId);
    }

    // Generate temporary password
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const temporaryPasswordHash = await this.passwordService.hashPassword(temporaryPassword);
    const temporaryPasswordExpiry = this.passwordService.getTemporaryPasswordExpiry();

    // Update HCF password fields
    hcf.passwordHash = temporaryPasswordHash;
    hcf.forcePasswordChange = true;
    hcf.temporaryPassword = temporaryPassword; // Store plain text temporarily
    hcf.temporaryPasswordExpiry = temporaryPasswordExpiry;
    hcf.modifiedBy = modifiedBy || null;
    hcf.modifiedOn = new Date();

    const updatedHCF = await this.hcfRepository.update(hcfId, hcf);

    // Send credentials via email (optional - can be disabled if email service not configured)
    try {
      if (hcf.contactEmail) {
        await this.emailService.sendHCFPasswordReset({
          email: hcf.contactEmail,
          hcfCode: hcf.hcfCode,
          hcfName: hcf.hcfName,
          temporaryPassword,
          expiryHours: 24,
        });
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.warn('Failed to send password reset email:', error);
    }

    return {
      hcfId: updatedHCF.hcfId,
      temporaryPassword, // Return for admin display
    };
  }
}
