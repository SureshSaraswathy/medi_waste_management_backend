import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { FinanceYear } from '../entities/finance-year.domain.entity';

export const FINANCE_YEAR_REPOSITORY_TOKEN = 'FINANCE_YEAR_REPOSITORY';

export interface IFinanceYearRepository extends IBaseMasterRepository<FinanceYear> {
  /**
   * Find by finance year string (e.g., "2025-26")
   */
  findByFinYear(finYear: string): Promise<FinanceYear | null>;

  /**
   * Find all finance years ordered by start date descending
   */
  findAllOrderedByStartDate(): Promise<FinanceYear[]>;

  /**
   * Find all active finance years ordered by start date descending
   */
  findAllActiveOrderedByStartDate(): Promise<FinanceYear[]>;
}
