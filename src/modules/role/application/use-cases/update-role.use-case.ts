import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../domain/interfaces/role.repository.interface';
import { Role } from '../../domain/entities/role.domain.entity';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleNotFoundException, DuplicateRoleNameException } from '../../domain/exceptions/role.exceptions';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(roleId: string, updateRoleDto: UpdateRoleDto, modifiedBy?: string): Promise<Role> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    // Check for duplicate role name if roleName is being updated
    if (updateRoleDto.roleName && updateRoleDto.roleName !== role.roleName) {
      const existing = await this.roleRepository.findByCompanyAndName(
        role.companyId,
        updateRoleDto.roleName,
      );
      if (existing && existing.roleId !== roleId) {
        throw new DuplicateRoleNameException(role.companyId, updateRoleDto.roleName);
      }
    }

    // Update domain entity
    role.update({
      roleName: updateRoleDto.roleName,
      roleDescription: updateRoleDto.roleDescription,
      landingPage: updateRoleDto.landingPage,
      accessLevel: updateRoleDto.accessLevel,
      status: updateRoleDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist through repository
    return this.roleRepository.update(roleId, role);
  }
}
