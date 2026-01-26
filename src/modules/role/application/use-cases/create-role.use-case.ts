import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../domain/interfaces/role.repository.interface';
import { Role } from '../../domain/entities/role.domain.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { DuplicateRoleNameException } from '../../domain/exceptions/role.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(createRoleDto: CreateRoleDto, createdBy?: string): Promise<Role> {
    // Check for duplicate role name within the same company
    const existing = await this.roleRepository.findByCompanyAndName(
      createRoleDto.companyId,
      createRoleDto.roleName,
    );
    if (existing) {
      throw new DuplicateRoleNameException(createRoleDto.companyId, createRoleDto.roleName);
    }

    // Create domain entity
    const role = Role.create({
      roleId: randomUUID(),
      companyId: createRoleDto.companyId,
      roleName: createRoleDto.roleName,
      roleDescription: createRoleDto.roleDescription || null,
      landingPage: createRoleDto.landingPage || null,
      accessLevel: createRoleDto.accessLevel || null,
      createdBy: createdBy || null,
    });

    // Set status if provided
    if (createRoleDto.status) {
      role.update({ status: createRoleDto.status, modifiedBy: createdBy || null });
    }

    // Persist through repository
    return this.roleRepository.create(role);
  }
}
