/**
 * Company Domain Entity - Core Domain Layer
 * Contains business logic and rules. Independent of infrastructure.
 */
export enum CompanyStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export interface CompanyProps {
  companyId: string;
  companyCode: string;
  companyName: string;
  status: CompanyStatus;
  createdBy: string | null;
  createdOn: Date;
  modifiedBy: string | null;
  modifiedOn: Date;
  isDeleted: boolean;
}

export class Company {
  private constructor(private props: CompanyProps) {}

  get companyId(): string {
    return this.props.companyId;
  }
  get companyCode(): string {
    return this.props.companyCode;
  }
  get companyName(): string {
    return this.props.companyName;
  }
  get status(): CompanyStatus {
    return this.props.status;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }
  get createdOn(): Date {
    return this.props.createdOn;
  }
  get modifiedBy(): string | null {
    return this.props.modifiedBy;
  }
  get modifiedOn(): Date {
    return this.props.modifiedOn;
  }
  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  /**
   * Factory method to create a new Company instance.
   */
  static create(data: {
    companyId: string;
    companyCode: string;
    companyName: string;
    createdBy?: string | null;
  }): Company {
    const now = new Date();
    return new Company({
      companyId: data.companyId,
      companyCode: data.companyCode,
      companyName: data.companyName,
      status: CompanyStatus.ACTIVE,
      createdBy: data.createdBy || null,
      createdOn: now,
      modifiedBy: null,
      modifiedOn: now,
      isDeleted: false,
    });
  }

  /**
   * Reconstitutes a Company domain entity from raw data.
   */
  static reconstitute(props: CompanyProps): Company {
    return new Company(props);
  }

  /**
   * Business method: Update company details.
   */
  public update(data: {
    companyCode?: string;
    companyName?: string;
    status?: CompanyStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.companyCode !== undefined) this.props.companyCode = data.companyCode;
    if (data.companyName !== undefined) this.props.companyName = data.companyName;
    if (data.status !== undefined) this.props.status = data.status;
    this.props.modifiedBy = data.modifiedBy || null;
    this.props.modifiedOn = new Date();
  }

  /**
   * Business method: Soft delete the company.
   */
  public softDelete(modifiedBy?: string | null): void {
    this.props.isDeleted = true;
    this.props.modifiedBy = modifiedBy || null;
    this.props.modifiedOn = new Date();
  }

  /**
   * Business method: Activate the company.
   */
  public activate(modifiedBy?: string | null): void {
    this.props.status = CompanyStatus.ACTIVE;
    this.props.modifiedBy = modifiedBy || null;
    this.props.modifiedOn = new Date();
  }

  /**
   * Business method: Deactivate the company.
   */
  public deactivate(modifiedBy?: string | null): void {
    this.props.status = CompanyStatus.INACTIVE;
    this.props.modifiedBy = modifiedBy || null;
    this.props.modifiedOn = new Date();
  }
}
