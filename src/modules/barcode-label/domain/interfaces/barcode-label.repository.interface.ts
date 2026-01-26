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
  getLastSequenceNumber(hcfCode: string, barcodeType: BarcodeType): Promise<number>;
  softDelete(barcodeLabelId: string): Promise<void>;
}
