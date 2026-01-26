/**
 * Base Repository Interface for Master Data
 * Provides common CRUD operations for all master data repositories
 */
export interface IBaseMasterRepository<T> {
  /**
   * Create a new master record
   */
  create(entity: T): Promise<T>;

  /**
   * Find by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all active records
   */
  findAll(): Promise<T[]>;

  /**
   * Find all active records (non-deleted)
   */
  findAllActive(): Promise<T[]>;

  /**
   * Update a master record
   */
  update(id: string, entity: T): Promise<T>;

  /**
   * Soft delete a master record
   */
  softDelete(id: string): Promise<void>;
}
