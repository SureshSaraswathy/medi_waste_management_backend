import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../domain/interfaces/role.repository.interface';
import { RoleNotFoundException } from '../../domain/exceptions/role.exceptions';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(roleId: string): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    // Soft delete through repository
    await this.roleRepository.delete(roleId);
  }
}
