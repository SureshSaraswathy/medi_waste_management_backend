import { User } from '../entities/user.domain.entity';

/**
 * Repository Interface - Abstraction for data persistence
 * This is in the domain layer, not infrastructure
 */
export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(userId: string): Promise<User | null>;
  findByMobile(companyId: string, mobileNumber: string): Promise<User | null>;
  findByUserName(companyId: string, userName: string): Promise<User | null>;
  update(userId: string, user: User): Promise<User>;
  delete(userId: string): Promise<void>;
  findAllByCompany(companyId: string): Promise<User[]>;
}

/**
 * Repository token for dependency injection
 */
export const USER_REPOSITORY_TOKEN = 'IUserRepository';
