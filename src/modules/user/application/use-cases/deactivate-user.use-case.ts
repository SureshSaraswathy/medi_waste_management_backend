import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Deactivate User
 */
@Injectable()
export class DeactivateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Deactivate user (domain method)
    user.deactivate(undefined); // modifiedBy - should be extracted from request context

    // Persist through repository
    return this.userRepository.update(userId, user);
  }
}
