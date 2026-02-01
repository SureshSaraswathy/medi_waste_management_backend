import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { User, UserStatus } from '../../domain/entities/user.domain.entity';
import { UserEntity } from './user.entity';
import { UserEmployeeProfileEntity } from './user-employee-profile.entity';

/**
 * TypeORM Repository Implementation
 * Infrastructure layer - implements domain repository interface
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity, 'master') // Use master database connection
    private readonly repository: Repository<UserEntity>,
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
  ) {}

  async create(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(userId: string): Promise<User | null> {
    const entity = await this.findEntityById(userId, false);
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Internal helper to fetch users with an option to include soft-deleted rows.
   * Important for flows like "soft delete", where `isDeleted` becomes true and
   * we still need to read the record back after `update()` without failing.
   */
  private async findEntityById(userId: string, includeDeleted: boolean): Promise<UserEntity | null> {
    if (includeDeleted) {
      return this.repository.findOne({ where: { userId } as any });
    }
    return this.repository.findOne({ where: { userId, isDeleted: false } as any });
  }

  async findByMobile(companyId: string, mobileNumber: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: {
        companyId,
        mobileNumber,
        isDeleted: false,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserName(companyId: string, userName: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: {
        companyId,
        userName,
        isDeleted: false,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(userId: string, user: User): Promise<User> {
    const entity = this.toEntity(user);
    await this.repository.update(userId, entity);

    // NOTE:
    // `findById()` filters by `isDeleted=false`. For soft-delete flows, the updated
    // record will not be returned by `findById()` anymore. So we fetch including deleted.
    const updatedEntity = await this.findEntityById(userId, true);
    if (!updatedEntity) throw new Error('User not found after update');
    return this.toDomain(updatedEntity);
  }

  async delete(userId: string): Promise<void> {
    await this.repository.update(userId, { isDeleted: true });
  }

  async findAllByCompany(companyId: string): Promise<User[]> {
    const entities = await this.repository.find({
      where: { companyId, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Map Domain Entity to TypeORM Entity
   */
  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.userId = user.userId;
    entity.companyId = user.companyId;
    entity.userName = user.userName;
    entity.mobileNumber = user.mobileNumber;
    entity.employeeCode = user.employeeCode;
    entity.userRoleId = user.userRoleId;
    entity.status = user.status;
    entity.passwordEnabled = user.passwordEnabled;
    entity.otpEnabled = user.otpEnabled;
    entity.forceOtpOnNextLogin = user.forceOtpOnNextLogin;
    entity.webLogin = user.webLogin;
    entity.mobileAppAccess = user.mobileAppAccess;
    entity.passwordHash = user.passwordHash;
    entity.forcePasswordChange = user.forcePasswordChange;
    entity.temporaryPassword = user.temporaryPassword;
    entity.temporaryPasswordExpiry = user.temporaryPasswordExpiry;
    entity.createdBy = user.createdBy;
    entity.createdOn = user.createdOn;
    entity.modifiedBy = user.modifiedBy;
    entity.modifiedOn = user.modifiedOn;
    entity.isDeleted = user.isDeleted;
    return entity;
  }

  /**
   * Map TypeORM Entity to Domain Entity
   */
  private toDomain(entity: UserEntity): User {
    return User.reconstitute({
      userId: entity.userId,
      companyId: entity.companyId,
      userName: entity.userName,
      mobileNumber: entity.mobileNumber,
      employeeCode: entity.employeeCode,
      userRoleId: entity.userRoleId,
      status: entity.status as UserStatus,
      passwordEnabled: entity.passwordEnabled,
      otpEnabled: entity.otpEnabled,
      forceOtpOnNextLogin: entity.forceOtpOnNextLogin,
      webLogin: entity.webLogin,
      mobileAppAccess: entity.mobileAppAccess,
      passwordHash: entity.passwordHash,
      forcePasswordChange: entity.forcePasswordChange,
      temporaryPassword: entity.temporaryPassword,
      temporaryPasswordExpiry: entity.temporaryPasswordExpiry,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
