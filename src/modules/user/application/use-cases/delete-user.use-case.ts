import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions';

/**
 * Use Case: Delete User (Soft Delete)
 */
@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Soft delete through domain method
    user.delete();
    await this.userRepository.update(userId, user);
  }
}
