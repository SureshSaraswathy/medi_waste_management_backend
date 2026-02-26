import { Company } from '../entities/company.domain.entity';

export const COMPANY_REPOSITORY_TOKEN = 'ICompanyRepository';

/**
 * Company Repository Interface - Core Domain Layer
 * Defines the contract for data access operations for the Company entity.
 */
export interface ICompanyRepository {
  create(company: Company, additionalFields?: any): Promise<Company>;
  findById(companyId: string): Promise<Company | null>;
  findByCode(companyCode: string): Promise<Company | null>;
  update(companyId: string, company: Company, additionalFields?: any): Promise<Company>;
  delete(companyId: string): Promise<void>; // Soft delete
  findAll(): Promise<Company[]>;
  findActive(): Promise<Company[]>;
  getEntityById(companyId: string): Promise<any | null>; // Get raw entity with all fields
  getAllEntities(activeOnly?: boolean): Promise<any[]>; // Get raw entities with all fields
}
