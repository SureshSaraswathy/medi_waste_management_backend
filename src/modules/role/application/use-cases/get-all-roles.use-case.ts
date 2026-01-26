import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../domain/interfaces/role.repository.interface';
import { Role } from '../../domain/entities/role.domain.entity';

@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(companyId?: string, activeOnly?: boolean): Promise<Role[]> {
    if (companyId) {
      if (activeOnly) {
        return this.roleRepository.findActiveByCompany(companyId);
      }
      return this.roleRepository.findAllByCompany(companyId);
    }
    // If no companyId, return empty array (roles are company-specific)
    // In the future, we might want to add a method to get all roles across companies
    return [];
  }
}
