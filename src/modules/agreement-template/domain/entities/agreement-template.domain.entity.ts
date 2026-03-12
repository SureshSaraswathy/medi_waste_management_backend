import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class AgreementTemplate extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly templateCode: string,
    public readonly templateName: string,
    public readonly agreementCategory: string | null,
    public readonly templateDescription: string | null,
    public readonly templateContent: string | null,
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
    templateId: string;
    templateCode: string;
    templateName: string;
    agreementCategory?: string | null;
    templateDescription?: string | null;
    templateContent?: string | null;
    status?: MasterStatus;
    createdBy?: string | null;
  }): AgreementTemplate {
    const now = new Date();
    return new AgreementTemplate(
      params.templateId,
      params.templateCode,
      params.templateName,
      params.agreementCategory || null,
      params.templateDescription || null,
      params.templateContent || null,
      params.status || MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    templateId: string;
    templateCode: string;
    templateName: string;
    agreementCategory: string | null;
    templateDescription: string | null;
    templateContent: string | null;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): AgreementTemplate {
    return new AgreementTemplate(
      data.templateId,
      data.templateCode,
      data.templateName,
      data.agreementCategory,
      data.templateDescription,
      data.templateContent,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(data: {
    templateCode?: string;
    templateName?: string;
    agreementCategory?: string | null;
    templateDescription?: string | null;
    templateContent?: string | null;
    status?: MasterStatus;
    modifiedBy?: string | null;
  }): void {
    if (data.templateCode !== undefined) {
      (this as any).templateCode = data.templateCode;
    }
    if (data.templateName !== undefined) {
      (this as any).templateName = data.templateName;
    }
    if (data.agreementCategory !== undefined) {
      (this as any).agreementCategory = data.agreementCategory;
    }
    if (data.templateDescription !== undefined) {
      (this as any).templateDescription = data.templateDescription;
    }
    if (data.templateContent !== undefined) {
      (this as any).templateContent = data.templateContent;
    }
    if (data.status !== undefined) {
      this.status = data.status;
    }
    this.modifiedBy = data.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  get templateId(): string {
    return this.id;
  }
}
