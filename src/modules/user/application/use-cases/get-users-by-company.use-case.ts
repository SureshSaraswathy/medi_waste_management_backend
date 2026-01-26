import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.domain.entity';

/**
 * Use Case: Get All Users by Company
 */
@Injectable()
export class GetUsersByCompanyUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(companyId: string): Promise<User[]> {
    return this.userRepository.findAllByCompany(companyId);
  }
}
