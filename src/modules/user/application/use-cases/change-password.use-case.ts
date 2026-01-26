import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { PasswordService } from '../services/password.service';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Change User Password
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    modifiedBy?: string,
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Validate password strength
    const validation = this.passwordService.validatePasswordStrength(changePasswordDto.newPassword);
    if (!validation.isValid) {
      // Create a user-friendly error message
      const errorMessage = validation.errors.length === 1
        ? validation.errors[0]
        : `Password requirements: ${validation.errors.join(', ')}`;
      throw new BadRequestException(errorMessage);
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      // If no password exists, allow setting new password (first-time password set)
      const newPasswordHash = await this.passwordService.hashPassword(changePasswordDto.newPassword);
      (user as any).passwordHash = newPasswordHash;
      (user as any).forcePasswordChange = false;
      (user as any).temporaryPassword = null;
      (user as any).temporaryPasswordExpiry = null;
      (user as any).modifiedBy = modifiedBy || null;
      (user as any).modifiedOn = new Date();
      
      return this.userRepository.update(userId, user);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    // Also check if it's a temporary password
    let isTemporaryPassword = false;
    if (user.temporaryPassword) {
      // Compare with temporary password (plain text stored temporarily)
      isTemporaryPassword = changePasswordDto.currentPassword === user.temporaryPassword;
      
      // Check if temporary password is expired
      if (isTemporaryPassword && this.passwordService.isTemporaryPasswordExpired(user.temporaryPasswordExpiry)) {
        throw new BadRequestException('Temporary password has expired. Please request a new password reset.');
      }
    }

    if (!isCurrentPasswordValid && !isTemporaryPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(changePasswordDto.newPassword);

    // Update password and clear temporary password fields
    (user as any).passwordHash = newPasswordHash;
    (user as any).forcePasswordChange = false;
    (user as any).temporaryPassword = null;
    (user as any).temporaryPasswordExpiry = null;
    (user as any).modifiedBy = modifiedBy || null;
    (user as any).modifiedOn = new Date();

    // Persist through repository
    return this.userRepository.update(userId, user);
  }
}
