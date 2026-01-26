import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../domain/interfaces/role.repository.interface';
import { Role } from '../../domain/entities/role.domain.entity';
import { RoleNotFoundException } from '../../domain/exceptions/role.exceptions';

@Injectable()
export class GetRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }
    return role;
  }
}
