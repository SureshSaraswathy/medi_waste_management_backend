import { Injectable, Inject } from '@nestjs/common';
import { HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { IHcfRepository } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { HCFTokenService } from '../services/hcf-token.service';
import { EmailService } from '../../../auth/services/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestHCFPasswordResetUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly tokenService: HCFTokenService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(identifier: string): Promise<{ success: boolean; message: string }> {
    // Find HCF by code or email
    const hcf = await this.hcfRepository.findByCodeOrEmail(identifier);

    // Don't reveal if HCF exists (security best practice)
    if (!hcf || !hcf.loginEnabled) {
      return {
        success: true,
        message: 'If the HCF exists and login is enabled, a reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = this.tokenService.generateResetToken();
    const resetTokenExpiry = this.tokenService.getResetTokenExpiry();

    // Update HCF with reset token
    hcf.resetToken = resetToken;
    hcf.resetTokenExpiry = resetTokenExpiry;
    await this.hcfRepository.update(hcf.hcfId, hcf);

    // Send reset email
    try {
      const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/hcf/reset-password?token=${resetToken}`;

      if (hcf.contactEmail) {
        await this.emailService.sendHCFPasswordResetLink({
          email: hcf.contactEmail,
          hcfCode: hcf.hcfCode,
          hcfName: hcf.hcfName,
          resetLink,
          expiryMinutes: 60,
        });
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.warn('Failed to send password reset email:', error);
    }

    return {
      success: true,
      message: 'Password reset link has been sent to your registered email.',
    };
  }
}
