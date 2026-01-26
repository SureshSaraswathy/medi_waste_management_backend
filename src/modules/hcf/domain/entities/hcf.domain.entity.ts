import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Hcf extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly hcfCode: string,
    public readonly companyId: string,
    public password: string | null,
    public hcfTypeCode: string | null,
    public hcfName: string,
    public hcfShortName: string | null,
    public areaId: string | null,
    public pincode: string | null,
    public district: string | null,
    public stateCode: string | null,
    public groupCode: string | null,
    public pcbZone: string | null,
    public billingName: string | null,
    public billingAddress: string | null,
    public serviceAddress: string | null,
    public gstin: string | null,
    public regnNum: string | null,
    public hospRegnDate: string | null,
    public billingType: string | null,
    public advAmount: string | null,
    public billingOption: string | null,
    public bedCount: string | null,
    public bedRate: string | null,
    public kgRate: string | null,
    public lumpsum: string | null,
    public accountsLandline: string | null,
    public accountsMobile: string | null,
    public accountsEmail: string | null,
    public contactName: string | null,
    public contactDesignation: string | null,
    public contactMobile: string | null,
    public contactEmail: string | null,
    public agrSignAuthName: string | null,
    public agrSignAuthDesignation: string | null,
    public drName: string | null,
    public drPhNo: string | null,
    public drEmail: string | null,
    public serviceStartDate: string | null,
    public serviceEndDate: string | null,
    public category: string | null,
    public route: string | null,
    public executiveAssigned: string | null,
    public submitBy: string | null,
    public agrID: string | null,
    public sortOrder: string | null,
    public isGovt: boolean,
    public isGSTExempt: boolean,
    public autoGen: boolean,
    status: MasterStatus,
    createdBy: string | null,
    createdOn: Date,
    modifiedBy: string | null,
    modifiedOn: Date,
    isDeleted: boolean,
  ) {
    super(id, status, createdBy, createdOn, modifiedBy, modifiedOn, isDeleted);
  }

  static create(params: {
    hcfId: string;
    hcfCode: string;
    companyId: string;
    password?: string | null;
    hcfTypeCode?: string | null;
    hcfName: string;
    hcfShortName?: string | null;
    areaId?: string | null;
    pincode?: string | null;
    district?: string | null;
    stateCode?: string | null;
    groupCode?: string | null;
    pcbZone?: string | null;
    billingName?: string | null;
    billingAddress?: string | null;
    serviceAddress?: string | null;
    gstin?: string | null;
    regnNum?: string | null;
    hospRegnDate?: string | null;
    billingType?: string | null;
    advAmount?: string | null;
    billingOption?: string | null;
    bedCount?: string | null;
    bedRate?: string | null;
    kgRate?: string | null;
    lumpsum?: string | null;
    accountsLandline?: string | null;
    accountsMobile?: string | null;
    accountsEmail?: string | null;
    contactName?: string | null;
    contactDesignation?: string | null;
    contactMobile?: string | null;
    contactEmail?: string | null;
    agrSignAuthName?: string | null;
    agrSignAuthDesignation?: string | null;
    drName?: string | null;
    drPhNo?: string | null;
    drEmail?: string | null;
    serviceStartDate?: string | null;
    serviceEndDate?: string | null;
    category?: string | null;
    route?: string | null;
    executiveAssigned?: string | null;
    submitBy?: string | null;
    agrID?: string | null;
    sortOrder?: string | null;
    isGovt?: boolean;
    isGSTExempt?: boolean;
    autoGen?: boolean;
    createdBy?: string | null;
  }): Hcf {
    const now = new Date();
    return new Hcf(
      params.hcfId,
      params.hcfCode,
      params.companyId,
      params.password || null,
      params.hcfTypeCode || null,
      params.hcfName,
      params.hcfShortName || null,
      params.areaId || null,
      params.pincode || null,
      params.district || null,
      params.stateCode || null,
      params.groupCode || null,
      params.pcbZone || null,
      params.billingName || null,
      params.billingAddress || null,
      params.serviceAddress || null,
      params.gstin || null,
      params.regnNum || null,
      params.hospRegnDate || null,
      params.billingType || null,
      params.advAmount || null,
      params.billingOption || null,
      params.bedCount || null,
      params.bedRate || null,
      params.kgRate || null,
      params.lumpsum || null,
      params.accountsLandline || null,
      params.accountsMobile || null,
      params.accountsEmail || null,
      params.contactName || null,
      params.contactDesignation || null,
      params.contactMobile || null,
      params.contactEmail || null,
      params.agrSignAuthName || null,
      params.agrSignAuthDesignation || null,
      params.drName || null,
      params.drPhNo || null,
      params.drEmail || null,
      params.serviceStartDate || null,
      params.serviceEndDate || null,
      params.category || null,
      params.route || null,
      params.executiveAssigned || null,
      params.submitBy || null,
      params.agrID || null,
      params.sortOrder || null,
      params.isGovt ?? false,
      params.isGSTExempt ?? false,
      params.autoGen ?? false,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    hcfId: string;
    hcfCode: string;
    companyId: string;
    password: string | null;
    hcfTypeCode: string | null;
    hcfName: string;
    hcfShortName: string | null;
    areaId: string | null;
    pincode: string | null;
    district: string | null;
    stateCode: string | null;
    groupCode: string | null;
    pcbZone: string | null;
    billingName: string | null;
    billingAddress: string | null;
    serviceAddress: string | null;
    gstin: string | null;
    regnNum: string | null;
    hospRegnDate: string | null;
    billingType: string | null;
    advAmount: string | null;
    billingOption: string | null;
    bedCount: string | null;
    bedRate: string | null;
    kgRate: string | null;
    lumpsum: string | null;
    accountsLandline: string | null;
    accountsMobile: string | null;
    accountsEmail: string | null;
    contactName: string | null;
    contactDesignation: string | null;
    contactMobile: string | null;
    contactEmail: string | null;
    agrSignAuthName: string | null;
    agrSignAuthDesignation: string | null;
    drName: string | null;
    drPhNo: string | null;
    drEmail: string | null;
    serviceStartDate: string | null;
    serviceEndDate: string | null;
    category: string | null;
    route: string | null;
    executiveAssigned: string | null;
    submitBy: string | null;
    agrID: string | null;
    sortOrder: string | null;
    isGovt: boolean;
    isGSTExempt: boolean;
    autoGen: boolean;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Hcf {
    return new Hcf(
      data.hcfId,
      data.hcfCode,
      data.companyId,
      data.password,
      data.hcfTypeCode,
      data.hcfName,
      data.hcfShortName,
      data.areaId,
      data.pincode,
      data.district,
      data.stateCode,
      data.groupCode,
      data.pcbZone,
      data.billingName,
      data.billingAddress,
      data.serviceAddress,
      data.gstin,
      data.regnNum,
      data.hospRegnDate,
      data.billingType,
      data.advAmount,
      data.billingOption,
      data.bedCount,
      data.bedRate,
      data.kgRate,
      data.lumpsum,
      data.accountsLandline,
      data.accountsMobile,
      data.accountsEmail,
      data.contactName,
      data.contactDesignation,
      data.contactMobile,
      data.contactEmail,
      data.agrSignAuthName,
      data.agrSignAuthDesignation,
      data.drName,
      data.drPhNo,
      data.drEmail,
      data.serviceStartDate,
      data.serviceEndDate,
      data.category,
      data.route,
      data.executiveAssigned,
      data.submitBy,
      data.agrID,
      data.sortOrder,
      data.isGovt,
      data.isGSTExempt,
      data.autoGen,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    hcfName?: string;
    hcfShortName?: string | null;
    areaId?: string | null;
    pincode?: string | null;
    district?: string | null;
    stateCode?: string | null;
    groupCode?: string | null;
    pcbZone?: string | null;
    billingName?: string | null;
    billingAddress?: string | null;
    serviceAddress?: string | null;
    gstin?: string | null;
    regnNum?: string | null;
    hospRegnDate?: string | null;
    billingType?: string | null;
    advAmount?: string | null;
    billingOption?: string | null;
    bedCount?: string | null;
    bedRate?: string | null;
    kgRate?: string | null;
    lumpsum?: string | null;
    accountsLandline?: string | null;
    accountsMobile?: string | null;
    accountsEmail?: string | null;
    contactName?: string | null;
    contactDesignation?: string | null;
    contactMobile?: string | null;
    contactEmail?: string | null;
    agrSignAuthName?: string | null;
    agrSignAuthDesignation?: string | null;
    drName?: string | null;
    drPhNo?: string | null;
    drEmail?: string | null;
    serviceStartDate?: string | null;
    serviceEndDate?: string | null;
    category?: string | null;
    route?: string | null;
    executiveAssigned?: string | null;
    submitBy?: string | null;
    agrID?: string | null;
    sortOrder?: string | null;
    isGovt?: boolean;
    isGSTExempt?: boolean;
    autoGen?: boolean;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.hcfName !== undefined) (this as any).hcfName = data.hcfName;
    if (data.hcfShortName !== undefined) (this as any).hcfShortName = data.hcfShortName;
    if (data.areaId !== undefined) (this as any).areaId = data.areaId;
    if (data.pincode !== undefined) (this as any).pincode = data.pincode;
    if (data.district !== undefined) (this as any).district = data.district;
    if (data.stateCode !== undefined) (this as any).stateCode = data.stateCode;
    if (data.groupCode !== undefined) (this as any).groupCode = data.groupCode;
    if (data.pcbZone !== undefined) (this as any).pcbZone = data.pcbZone;
    if (data.billingName !== undefined) (this as any).billingName = data.billingName;
    if (data.billingAddress !== undefined) (this as any).billingAddress = data.billingAddress;
    if (data.serviceAddress !== undefined) (this as any).serviceAddress = data.serviceAddress;
    if (data.gstin !== undefined) (this as any).gstin = data.gstin;
    if (data.regnNum !== undefined) (this as any).regnNum = data.regnNum;
    if (data.hospRegnDate !== undefined) (this as any).hospRegnDate = data.hospRegnDate;
    if (data.billingType !== undefined) (this as any).billingType = data.billingType;
    if (data.advAmount !== undefined) (this as any).advAmount = data.advAmount;
    if (data.billingOption !== undefined) (this as any).billingOption = data.billingOption;
    if (data.bedCount !== undefined) (this as any).bedCount = data.bedCount;
    if (data.bedRate !== undefined) (this as any).bedRate = data.bedRate;
    if (data.kgRate !== undefined) (this as any).kgRate = data.kgRate;
    if (data.lumpsum !== undefined) (this as any).lumpsum = data.lumpsum;
    if (data.accountsLandline !== undefined) (this as any).accountsLandline = data.accountsLandline;
    if (data.accountsMobile !== undefined) (this as any).accountsMobile = data.accountsMobile;
    if (data.accountsEmail !== undefined) (this as any).accountsEmail = data.accountsEmail;
    if (data.contactName !== undefined) (this as any).contactName = data.contactName;
    if (data.contactDesignation !== undefined) (this as any).contactDesignation = data.contactDesignation;
    if (data.contactMobile !== undefined) (this as any).contactMobile = data.contactMobile;
    if (data.contactEmail !== undefined) (this as any).contactEmail = data.contactEmail;
    if (data.agrSignAuthName !== undefined) (this as any).agrSignAuthName = data.agrSignAuthName;
    if (data.agrSignAuthDesignation !== undefined) (this as any).agrSignAuthDesignation = data.agrSignAuthDesignation;
    if (data.drName !== undefined) (this as any).drName = data.drName;
    if (data.drPhNo !== undefined) (this as any).drPhNo = data.drPhNo;
    if (data.drEmail !== undefined) (this as any).drEmail = data.drEmail;
    if (data.serviceStartDate !== undefined) (this as any).serviceStartDate = data.serviceStartDate;
    if (data.serviceEndDate !== undefined) (this as any).serviceEndDate = data.serviceEndDate;
    if (data.category !== undefined) (this as any).category = data.category;
    if (data.route !== undefined) (this as any).route = data.route;
    if (data.executiveAssigned !== undefined) (this as any).executiveAssigned = data.executiveAssigned;
    if (data.submitBy !== undefined) (this as any).submitBy = data.submitBy;
    if (data.agrID !== undefined) (this as any).agrID = data.agrID;
    if (data.sortOrder !== undefined) (this as any).sortOrder = data.sortOrder;
    if (data.isGovt !== undefined) (this as any).isGovt = data.isGovt;
    if (data.isGSTExempt !== undefined) (this as any).isGSTExempt = data.isGSTExempt;
    if (data.autoGen !== undefined) (this as any).autoGen = data.autoGen;
    if (data.status !== undefined) this.status = data.status;
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get hcfId(): string {
    return this.id;
  }
}
