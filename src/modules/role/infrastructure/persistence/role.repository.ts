import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../domain/interfaces/role.repository.interface';
import { Role, RoleStatus } from '../../domain/entities/role.domain.entity';
import { RoleEntity } from './role.entity';

/**
 * TypeORM Repository Implementation
 */
@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity, 'master')
    private readonly repository: Repository<RoleEntity>,
  ) {}

  async create(role: Role): Promise<Role> {
    const entity = this.toEntity(role);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(roleId: string): Promise<Role | null> {
    const entity = await this.repository.findOne({
      where: { roleId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyAndName(companyId: string, roleName: string): Promise<Role | null> {
    const entity = await this.repository.findOne({
      where: { companyId, roleName, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(roleId: string, role: Role): Promise<Role> {
    const entity = this.toEntity(role);
    await this.repository.update(roleId, entity);
    const updated = await this.findById(roleId);
    if (!updated) {
      throw new Error('Role not found after update');
    }
    return updated;
  }

  async delete(roleId: string): Promise<void> {
    await this.repository.update(roleId, { isDeleted: true });
  }

  async findAllByCompany(companyId: string): Promise<Role[]> {
    const entities = await this.repository.find({
      where: { companyId, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveByCompany(companyId: string): Promise<Role[]> {
    const entities = await this.repository.find({
      where: { companyId, status: RoleStatus.ACTIVE, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Map Domain Entity to TypeORM Entity
   */
  private toEntity(role: Role): RoleEntity {
    const entity = new RoleEntity();
    entity.roleId = role.roleId;
    entity.companyId = role.companyId;
    entity.roleName = role.roleName;
    entity.roleDescription = role.roleDescription;
    entity.landingPage = role.landingPage;
    entity.accessLevel = role.accessLevel;
    entity.status = role.status;
    entity.createdBy = role.createdBy;
    entity.createdOn = role.createdOn;
    entity.modifiedBy = role.modifiedBy;
    entity.modifiedOn = role.modifiedOn;
    entity.isDeleted = role.isDeleted;
    return entity;
  }

  /**
   * Map TypeORM Entity to Domain Entity
   */
  private toDomain(entity: RoleEntity): Role {
    return Role.reconstitute({
      roleId: entity.roleId,
      companyId: entity.companyId,
      roleName: entity.roleName,
      roleDescription: entity.roleDescription,
      landingPage: entity.landingPage,
      accessLevel: entity.accessLevel as any,
      status: entity.status as RoleStatus,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
