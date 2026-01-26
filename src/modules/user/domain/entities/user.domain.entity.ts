/**
 * Domain Entity - Pure TypeScript class (no framework dependencies)
 * Contains business logic and domain rules
 */
export enum UserStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class User {
  private constructor(
    public readonly userId: string,
    public readonly companyId: string,
    public readonly userName: string,
    public readonly mobileNumber: string,
    public readonly employeeCode: string | null,
    public readonly userRoleId: string | null,
    public status: UserStatus,
    public passwordEnabled: boolean,
    public otpEnabled: boolean,
    public forceOtpOnNextLogin: boolean,
    public webLogin: boolean,
    public mobileAppAccess: boolean,
    public passwordHash: string | null,
    public forcePasswordChange: boolean,
    public temporaryPassword: string | null,
    public temporaryPasswordExpiry: Date | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public isDeleted: boolean,
  ) {}

  /**
   * Factory method to create a new user
   */
  static create(params: {
    userId: string;
    companyId: string;
    userName: string;
    mobileNumber: string;
    employeeCode?: string;
    userRoleId?: string;
    createdBy?: string | null;
  }): User {
    const now = new Date();
    return new User(
      params.userId,
      params.companyId,
      params.userName,
      params.mobileNumber,
      params.employeeCode || null,
      params.userRoleId || null,
      UserStatus.DRAFT,
      false, // Login disabled by default
      false, // OTP disabled by default
      false, // Force OTP disabled by default
      false, // Web login disabled by default
      false, // Mobile app access disabled by default
      null, // passwordHash null on creation
      false, // forcePasswordChange false on creation
      null, // temporaryPassword null on creation
      null, // temporaryPasswordExpiry null on creation
      params.createdBy || null,
      now,
      null, // modifiedBy null on creation
      now,
      false,
    );
  }

  /**
   * Factory method to reconstitute from persistence
   */
  static reconstitute(data: {
    userId: string;
    companyId: string;
    userName: string;
    mobileNumber: string;
    employeeCode: string | null;
    userRoleId: string | null;
    status: UserStatus;
    passwordEnabled: boolean;
    otpEnabled: boolean;
    forceOtpOnNextLogin: boolean;
    webLogin: boolean;
    mobileAppAccess: boolean;
    passwordHash: string | null;
    forcePasswordChange: boolean;
    temporaryPassword: string | null;
    temporaryPasswordExpiry: Date | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): User {
    return new User(
      data.userId,
      data.companyId,
      data.userName,
      data.mobileNumber,
      data.employeeCode,
      data.userRoleId,
      data.status,
      data.passwordEnabled,
      data.otpEnabled,
      data.forceOtpOnNextLogin,
      data.webLogin,
      data.mobileAppAccess,
      data.passwordHash,
      data.forcePasswordChange,
      data.temporaryPassword,
      data.temporaryPasswordExpiry,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  /**
   * Domain method: Check if user can be activated
   */
  canBeActivated(): boolean {
    return this.status === UserStatus.DRAFT && !this.isDeleted;
  }

  /**
   * Domain method: Activate user
   */
  activate(
    passwordEnabled: boolean,
    otpEnabled: boolean,
    webLogin: boolean,
    mobileAppAccess: boolean,
    forceOtpOnNextLogin: boolean,
    modifiedBy?: string | null,
  ): void {
    if (!this.canBeActivated()) {
      throw new Error(
        `User ${this.userId} cannot be activated. Current status is ${this.status}.`,
      );
    }

    this.status = UserStatus.ACTIVE;
    this.passwordEnabled = passwordEnabled;
    this.otpEnabled = otpEnabled;
    this.webLogin = webLogin;
    this.mobileAppAccess = mobileAppAccess;
    this.forceOtpOnNextLogin = forceOtpOnNextLogin;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Domain method: Deactivate user
   */
  deactivate(modifiedBy?: string | null): void {
    this.status = UserStatus.INACTIVE;
    this.passwordEnabled = false;
    this.otpEnabled = false;
    this.webLogin = false;
    this.mobileAppAccess = false;
    this.forceOtpOnNextLogin = false;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Domain method: Update user details
   */
  update(
    params: {
      userName?: string;
      mobileNumber?: string;
      employeeCode?: string;
      userRoleId?: string;
    },
    modifiedBy?: string | null,
  ): void {
    if (params.userName) {
      (this as any).userName = params.userName;
    }
    if (params.mobileNumber) {
      (this as any).mobileNumber = params.mobileNumber;
    }
    if (params.employeeCode !== undefined) {
      (this as any).employeeCode = params.employeeCode;
    }
    if (params.userRoleId !== undefined) {
      (this as any).userRoleId = params.userRoleId;
    }
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Domain method: Soft delete user
   */
  delete(modifiedBy?: string | null): void {
    this.isDeleted = true;
    this.modifiedBy = modifiedBy || null;
    this.modifiedOn = new Date();
  }

  /**
   * Domain method: Check if user is active
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isDeleted;
  }
}
