import { Role } from '../entities/role.domain.entity';

export const ROLE_REPOSITORY_TOKEN = 'IRoleRepository';

/**
 * Role Repository Interface - Core Domain Layer
 */
export interface IRoleRepository {
  create(role: Role): Promise<Role>;
  findById(roleId: string): Promise<Role | null>;
  findByCompanyAndName(companyId: string, roleName: string): Promise<Role | null>;
  update(roleId: string, role: Role): Promise<Role>;
  delete(roleId: string): Promise<void>; // Soft delete
  findAllByCompany(companyId: string): Promise<Role[]>;
  findActiveByCompany(companyId: string): Promise<Role[]>;
}
