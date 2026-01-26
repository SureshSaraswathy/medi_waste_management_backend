import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User, UserStatus } from '../../domain/entities/user.domain.entity';
import { ActivateUserDto } from '../dto/activate-user.dto';
import {
  UserNotFoundException,
  UserNotDraftException,
} from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Activate User
 */
@Injectable()
export class ActivateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, activateUserDto: ActivateUserDto, modifiedBy?: string): Promise<User> {
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
      return this.userRepository.update(userId, user);
    }

    // Check if user can be activated (domain logic) - only for Draft users
    if (!user.canBeActivated()) {
      throw new UserNotDraftException(userId, user.status);
    }

    // Activate user (domain method) - changes status from Draft to Active
    user.activate(
      activateUserDto.passwordEnabled ?? false,
      activateUserDto.otpEnabled ?? false,
      activateUserDto.webLogin ?? false,
      activateUserDto.mobileAppAccess ?? false,
      activateUserDto.forceOtpOnNextLogin ?? false,
      modifiedBy || undefined,
    );

    // Persist through repository
    return this.userRepository.update(userId, user);
  }
}
