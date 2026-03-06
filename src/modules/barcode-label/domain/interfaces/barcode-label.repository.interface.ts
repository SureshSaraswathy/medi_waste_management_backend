import { BarcodeLabel } from '../entities/barcode-label.domain.entity';
import { BarcodeType } from '../../infrastructure/transaction/barcode-label.entity';

export const BARCODE_LABEL_REPOSITORY_TOKEN = 'BARCODE_LABEL_REPOSITORY';

export interface IBarcodeLabelRepository {
  create(barcodeLabel: BarcodeLabel): Promise<BarcodeLabel>;
  createMany(barcodeLabels: BarcodeLabel[]): Promise<BarcodeLabel[]>;
  findById(barcodeLabelId: string): Promise<BarcodeLabel | null>;
  findByBarcodeValue(barcodeValue: string): Promise<BarcodeLabel | null>;
  findAll(): Promise<BarcodeLabel[]>;
  findByHcf(hcfId: string): Promise<BarcodeLabel[]>;
  findByCompany(companyId: string): Promise<BarcodeLabel[]>;
  findByHcfCodeAndType(hcfCode: string, barcodeType: BarcodeType): Promise<BarcodeLabel[]>;
  getLastSequenceNumber(): Promise<number>; // Global sequence, no parameters
  update(barcodeLabel: BarcodeLabel): Promise<BarcodeLabel>;
  softDelete(barcodeLabelId: string): Promise<void>;
  findWithPagination(params: {
    page: number;
    limit: number;
    search?: string;
    colorBlock?: string;
    barcodeType?: BarcodeType;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    includeDeleted?: boolean;
  }): Promise<{ data: BarcodeLabel[]; total: number; page: number; limit: number }>;
  getTotalCounts(): Promise<{ total: number; barcodes: number; qrCodes: number }>;
}
