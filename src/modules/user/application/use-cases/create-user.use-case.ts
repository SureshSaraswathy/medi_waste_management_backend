import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  DuplicateMobileNumberException,
  DuplicateUserNameException,
} from '../../domain/exceptions/user.exceptions';
import { randomUUID } from 'crypto';

/**
 * Use Case: Create User
 * Application layer - orchestrates domain logic
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<User> {
    // Check for duplicate mobile number within company
    const existingMobile = await this.userRepository.findByMobile(
      createUserDto.companyId,
      createUserDto.mobileNumber,
    );
    if (existingMobile) {
      throw new DuplicateMobileNumberException(
        createUserDto.mobileNumber,
        createUserDto.companyId,
      );
    }

    // Check for duplicate user name within company
    const existingUserName = await this.userRepository.findByUserName(
      createUserDto.companyId,
      createUserDto.userName,
    );
    if (existingUserName) {
      throw new DuplicateUserNameException(
        createUserDto.userName,
        createUserDto.companyId,
      );
    }

    // Create domain entity using factory method
    const user = User.create({
      userId: randomUUID(),
      companyId: createUserDto.companyId,
      userName: createUserDto.userName,
      mobileNumber: createUserDto.mobileNumber,
      employeeCode: createUserDto.employeeCode,
      userRoleId: createUserDto.userRoleId,
    });

    // Persist through repository
    return this.userRepository.create(user);
  }
}
