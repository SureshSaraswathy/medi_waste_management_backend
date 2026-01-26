import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { PasswordService } from '../services/password.service';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Admin Reset User Password
 * Generates a new temporary password and forces password change
 */
@Injectable()
export class AdminResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(userId: string, modifiedBy?: string): Promise<{ user: User; temporaryPassword: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Generate new temporary password
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const temporaryPasswordHash = await this.passwordService.hashPassword(temporaryPassword);
    const temporaryPasswordExpiry = this.passwordService.getTemporaryPasswordExpiry();

    // Update password fields
    (user as any).passwordHash = temporaryPasswordHash;
    (user as any).forcePasswordChange = true;
    (user as any).temporaryPassword = temporaryPassword; // Store plain text temporarily
    (user as any).temporaryPasswordExpiry = temporaryPasswordExpiry;
    (user as any).modifiedBy = modifiedBy || null;
    (user as any).modifiedOn = new Date();

    // Persist through repository
    const updatedUser = await this.userRepository.update(userId, user);

    // Return user with temporary password (plain text - shown once to admin)
    return {
      user: updatedUser,
      temporaryPassword,
    };
  }
}
