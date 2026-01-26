import { BaseMasterEntity, MasterStatus } from '../../../../common/base/master-data.base.entity';

export class Category extends BaseMasterEntity {
  private constructor(
    id: string,
    public readonly categoryCode: string,
    public readonly categoryName: string,
    public readonly companyId: string,
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
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    companyId: string;
    createdBy?: string | null;
  }): Category {
    const now = new Date();
    return new Category(
      params.categoryId,
      params.categoryCode,
      params.categoryName,
      params.companyId,
      MasterStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
    companyId: string;
    status: MasterStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): Category {
    return new Category(
      data.categoryId,
      data.categoryCode,
      data.categoryName,
      data.companyId,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

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

  get categoryId(): string {
    return this.id;
  }
}
