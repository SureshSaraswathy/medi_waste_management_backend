import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  DuplicateMobileNumberException,
  DuplicateUserNameException,
  UserNotFoundException,
} from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Update User
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // If mobile number is being updated, check for duplicates
    if (updateUserDto.mobileNumber && updateUserDto.mobileNumber !== user.mobileNumber) {
      const existingMobile = await this.userRepository.findByMobile(
        updateUserDto.companyId || user.companyId,
        updateUserDto.mobileNumber,
      );
      if (existingMobile && existingMobile.userId !== userId) {
        throw new DuplicateMobileNumberException(
          updateUserDto.mobileNumber,
          updateUserDto.companyId || user.companyId,
        );
      }
    }

    // If user name is being updated, check for duplicates
    if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
      const existingUserName = await this.userRepository.findByUserName(
        updateUserDto.companyId || user.companyId,
        updateUserDto.userName,
      );
      if (existingUserName && existingUserName.userId !== userId) {
        throw new DuplicateUserNameException(
          updateUserDto.userName,
          updateUserDto.companyId || user.companyId,
        );
      }
    }

    // Update domain entity
    user.update({
      userName: updateUserDto.userName,
      mobileNumber: updateUserDto.mobileNumber,
      employeeCode: updateUserDto.employeeCode,
      userRoleId: updateUserDto.userRoleId,
    });

    // Persist through repository
    return this.userRepository.update(userId, user);
  }
}
