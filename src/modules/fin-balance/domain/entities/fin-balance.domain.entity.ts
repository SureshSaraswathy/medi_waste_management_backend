export class FinBalance {
  constructor(
    public readonly finBalanceId: string,
    public readonly companyId: string,
    public readonly hcfId: string,
    public openingBalance: number, // Mutable for updates
    public currentBalance: number,
    public readonly isManual: boolean,
    public notes: string | null, // Mutable for updates
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    finBalanceId: string;
    companyId: string;
    hcfId: string;
    openingBalance: number;
    currentBalance?: number;
    isManual?: boolean;
    notes?: string | null;
    createdBy?: string | null;
  }): FinBalance {
    const now = new Date();
    return new FinBalance(
      params.finBalanceId,
      params.companyId,
      params.hcfId,
      params.openingBalance,
      params.currentBalance ?? params.openingBalance,
      params.isManual ?? true,
      params.notes ?? null,
      params.createdBy ?? null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(params: {
    finBalanceId: string;
    companyId: string;
    hcfId: string;
    openingBalance: number;
    currentBalance: number;
    isManual: boolean;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): FinBalance {
    return new FinBalance(
      params.finBalanceId,
      params.companyId,
      params.hcfId,
      params.openingBalance,
      params.currentBalance,
      params.isManual,
      params.notes,
      params.createdBy,
      params.createdOn,
      params.modifiedBy,
      params.modifiedOn,
      params.isDeleted,
    );
  }

  /**
   * Reset current balance to opening balance (used on update)
   */
  resetBalance(modifiedBy?: string | null): void {
    this.currentBalance = this.openingBalance;
    this.modifiedBy = modifiedBy ?? null;
    this.modifiedOn = new Date();
  }

  /**
   * Update opening balance and reset current balance
   */
  updateOpeningBalance(newOpeningBalance: number, modifiedBy?: string | null): void {
    this.openingBalance = newOpeningBalance;
    this.currentBalance = newOpeningBalance;
    this.modifiedBy = modifiedBy ?? null;
    this.modifiedOn = new Date();
  }
}
