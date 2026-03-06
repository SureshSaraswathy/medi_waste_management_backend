import { BarcodeType, ColorBlock, BarcodeStatus } from '../../infrastructure/transaction/barcode-label.entity';

export class BarcodeLabel {
  private constructor(
    public readonly id: string,
    public readonly hcfCode: string,
    public readonly hcfId: string,
    public readonly companyId: string,
    public readonly sequenceNumber: number,
    public readonly barcodeValue: string,
    public readonly barcodeType: BarcodeType,
    public readonly colorBlock: ColorBlock,
    public status: BarcodeStatus,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    barcodeLabelId: string;
    hcfCode: string;
    hcfId: string;
    companyId: string;
    sequenceNumber: number;
    barcodeValue: string;
    barcodeType: BarcodeType;
    colorBlock: ColorBlock;
    status?: BarcodeStatus;
    createdBy?: string | null;
  }): BarcodeLabel {
    const now = new Date();
    return new BarcodeLabel(
      params.barcodeLabelId,
      params.hcfCode,
      params.hcfId,
      params.companyId,
      params.sequenceNumber,
      params.barcodeValue,
      params.barcodeType,
      params.colorBlock,
      params.status || BarcodeStatus.ACTIVE,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    barcodeLabelId: string;
    hcfCode: string;
    hcfId: string;
    companyId: string;
    sequenceNumber: number;
    barcodeValue: string;
    barcodeType: BarcodeType;
    colorBlock: ColorBlock;
    status: BarcodeStatus;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): BarcodeLabel {
    return new BarcodeLabel(
      data.barcodeLabelId,
      data.hcfCode,
      data.hcfId,
      data.companyId,
      data.sequenceNumber,
      data.barcodeValue,
      data.barcodeType,
      data.colorBlock,
      data.status,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  updateColorBlock(colorBlock: ColorBlock, modifiedBy: string | null): void {
    (this as any).colorBlock = colorBlock;
    (this as any).modifiedBy = modifiedBy;
    (this as any).modifiedOn = new Date();
  }

  updateStatus(status: BarcodeStatus, modifiedBy: string | null): void {
    this.status = status;
    (this as any).modifiedBy = modifiedBy;
    (this as any).modifiedOn = new Date();
  }

  get barcodeLabelId(): string {
    return this.id;
  }
}
