import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User, UserStatus } from '../../domain/entities/user.domain.entity';
import { ActivateUserWithPasswordDto } from '../dto/activate-user-with-password.dto';
import { PasswordService } from '../services/password.service';
import {
  UserNotFoundException,
  UserNotDraftException,
} from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Activate User with Temporary Password Generation
 */
@Injectable()
export class ActivateUserWithPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    userId: string,
    activateUserDto: ActivateUserWithPasswordDto,
    modifiedBy?: string,
  ): Promise<{ user: User; temporaryPassword: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // If user is already Active, update activation settings without changing status
    if (user.status === UserStatus.ACTIVE) {
      // Update activation settings for already active users
      user.passwordEnabled = activateUserDto.passwordEnabled ?? user.passwordEnabled;
      user.otpEnabled = activateUserDto.otpEnabled ?? user.otpEnabled;
      user.webLogin = activateUserDto.webLogin ?? user.webLogin;
      user.mobileAppAccess = activateUserDto.mobileAppAccess ?? user.mobileAppAccess;
      user.forceOtpOnNextLogin = activateUserDto.forceOtpOnNextLogin ?? user.forceOtpOnNextLogin;
      user.modifiedBy = modifiedBy || null;
      user.modifiedOn = new Date();
      
      // Persist through repository
      const updatedUser = await this.userRepository.update(userId, user);
      return { user: updatedUser, temporaryPassword: '' }; // No new temp password for already active users
    }

    // Check if user can be activated (domain logic) - only for Draft users
    if (!user.canBeActivated()) {
      throw new UserNotDraftException(userId, user.status);
    }

    // Generate temporary password
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const temporaryPasswordHash = await this.passwordService.hashPassword(temporaryPassword);
    const temporaryPasswordExpiry = this.passwordService.getTemporaryPasswordExpiry();

    // Activate user (domain method) - changes status from Draft to Active
    user.activate(
      activateUserDto.passwordEnabled ?? false,
      activateUserDto.otpEnabled ?? false,
      activateUserDto.webLogin ?? false,
      activateUserDto.mobileAppAccess ?? false,
      activateUserDto.forceOtpOnNextLogin ?? false,
      modifiedBy || undefined,
    );

    // Set password-related fields
    (user as any).passwordHash = temporaryPasswordHash;
    (user as any).forcePasswordChange = true;
    (user as any).temporaryPassword = temporaryPassword; // Store plain text temporarily (will be cleared after display)
    (user as any).temporaryPasswordExpiry = temporaryPasswordExpiry;

    // Persist through repository
    const updatedUser = await this.userRepository.update(userId, user);

    // Return user with temporary password (plain text - shown once)
    return {
      user: updatedUser,
      temporaryPassword, // Return plain text password to show to admin
    };
  }
}
