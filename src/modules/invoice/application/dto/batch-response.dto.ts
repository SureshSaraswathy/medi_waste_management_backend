import { BatchType, BatchStatus } from '../../infrastructure/transaction/invoice-batch.entity';

export class BatchResponseDto {
  id: string;
  type: BatchType;
  companyId: string;
  siteId: string | null;
  periodFrom: Date | null;
  periodTo: Date | null;
  billingMonth: string | null;
  status: BatchStatus;
  totalRecords: number;
  createdBy: string | null;
  createdAt: Date;
  postedAt: Date | null;
}

export class BatchItemResponseDto {
  id: string;
  batchId: string;
  customerId: string; // hcf_id
  description: string | null;
  quantity: number;
  rate: number;
  taxPercent: number;
  amount: number;
  dueDate: Date;
  errorFlag: boolean;
  errorMessage: string | null;
  isSelected: boolean;
  createdAt: Date;
}

export class BatchPreviewResponseDto extends BatchResponseDto {
  items: BatchItemResponseDto[];
}
