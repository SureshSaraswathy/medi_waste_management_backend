import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

/**
 * Finance Year Domain Entity
 */
export class FinanceYear extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly finYear: string, // Format: YYYY-YY (e.g., 2025-26)
    public readonly fyStartDate: Date,
    public readonly fyEndDate: Date,
    status: MasterStatus,
    createdBy: string | null,
    createdOn: Date,
    modifiedBy: string | null,
    modifiedOn: Date,
    isDeleted: boolean,
  ) {
    super(id, status, createdBy, createdOn, modifiedBy, modifiedOn, isDeleted);
  }

  /**
   * Factory method to create a new Finance Year
   */
  static create(params: {
    financeYearId: string;
    startYear: number; // e.g., 2025
    createdBy?: string | null;
  }): FinanceYear {
    const now = new Date();
    
    // Generate Finance Year (YYYY-YY format)
    const finYear = FinanceYear.generateFinanceYear(params.startYear);
    
    // Generate Start Date (01-Apr-YYYY)
    const fyStartDate = new Date(params.startYear, 3, 1); // Month 3 = April (0-indexed)
    
    // Generate End Date (31-Mar-YYYY+1)
    const fyEndDate = new Date(params.startYear + 1, 2, 31); // Month 2 = March (0-indexed)
    
    return new FinanceYear(
      params.financeYearId,
      finYear,
      fyStartDate,
      fyEndDate,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  /**
   * Generate Finance Year string from start year
   * Example: 2025 -> "2025-26"
   */
  static generateFinanceYear(startYear: number): string {
    const endYearShort = (startYear + 1) % 100;
    return `${startYear}-${endYearShort.toString().padStart(2, '0')}`;
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(data: {
    financeYearId: string;
    finYear: string;
    fyStartDate: Date;
    fyEndDate: Date;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): FinanceYear {
    return new FinanceYear(
      data.financeYearId,
      data.finYear,
      data.fyStartDate,
      data.fyEndDate,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  /**
   * Update finance year details
   */
  update(data: {
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get financeYearId(): string {
    return this.id;
  }

  /**
   * Get start year from finance year string
   */
  getStartYear(): number {
    return parseInt(this.finYear.split('-')[0]);
  }
}
