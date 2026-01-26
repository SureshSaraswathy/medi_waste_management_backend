/**
 * Role Domain Entity - Core Domain Layer
 */
export enum RoleStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum AccessLevel {
  ADMIN = 'Admin',
  MAKER = 'Maker',
  CHECKER = 'Checker',
  VIEWER = 'Viewer',
}

export interface RoleProps {
  roleId: string;
  companyId: string;
  roleName: string;
  roleDescription: string | null;
  landingPage: string | null;
  accessLevel: AccessLevel | null;
  status: RoleStatus;
  createdBy: string | null;
  createdOn: Date;
  modifiedBy: string | null;
  modifiedOn: Date;
  isDeleted: boolean;
}

export class Role {
  private constructor(private props: RoleProps) {}

  get roleId(): string {
    return this.props.roleId;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get roleName(): string {
    return this.props.roleName;
  }
  get roleDescription(): string | null {
    return this.props.roleDescription;
  }
  get landingPage(): string | null {
    return this.props.landingPage;
  }
  get accessLevel(): AccessLevel | null {
    return this.props.accessLevel;
  }
  get status(): RoleStatus {
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
   * Factory method to create a new Role instance.
   */
  static create(data: {
    roleId: string;
    companyId: string;
    roleName: string;
    roleDescription?: string | null;
    landingPage?: string | null;
    accessLevel?: AccessLevel | null;
    createdBy?: string | null;
  }): Role {
    const now = new Date();
    return new Role({
      roleId: data.roleId,
      companyId: data.companyId,
      roleName: data.roleName,
      roleDescription: data.roleDescription || null,
      landingPage: data.landingPage || null,
      accessLevel: data.accessLevel || null,
      status: RoleStatus.ACTIVE,
      createdBy: data.createdBy || null,
      createdOn: now,
      modifiedBy: null,
      modifiedOn: now,
      isDeleted: false,
    });
  }

  /**
   * Reconstitutes a Role domain entity from raw data.
   */
  static reconstitute(props: RoleProps): Role {
    return new Role(props);
  }

  /**
   * Business method: Update role details.
   */
  public update(data: {
    roleName?: string;
    roleDescription?: string | null;
    landingPage?: string | null;
    accessLevel?: AccessLevel | null;
    status?: RoleStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.roleName !== undefined) this.props.roleName = data.roleName;
    if (data.roleDescription !== undefined) this.props.roleDescription = data.roleDescription;
    if (data.landingPage !== undefined) this.props.landingPage = data.landingPage;
    if (data.accessLevel !== undefined) this.props.accessLevel = data.accessLevel;
    if (data.status !== undefined) this.props.status = data.status;
    this.props.modifiedBy = data.modifiedBy || null;
    this.props.modifiedOn = new Date();
  }

  /**
   * Business method: Soft delete the role.
   */
  public softDelete(modifiedBy?: string | null): void {
    this.props.isDeleted = true;
    this.props.modifiedBy = modifiedBy || null;
    this.props.modifiedOn = new Date();
  }

  /**
   * Business method: Activate the role.
   */
  public activate(modifiedBy?: string | null): void {
    this.props.status = RoleStatus.ACTIVE;
    this.props.modifiedBy = modifiedBy || null;
    this.props.modifiedOn = new Date();
  }

  /**
   * Business method: Deactivate the role.
   */
  public deactivate(modifiedBy?: string | null): void {
    this.props.status = RoleStatus.INACTIVE;
    this.props.modifiedBy = modifiedBy || null;
    this.props.modifiedOn = new Date();
  }
}
