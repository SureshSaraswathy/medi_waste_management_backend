import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsUUID } from 'class-validator';

export class BulkInvoicePdfJobDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(parseInt(process.env.MAX_BULK_PDF || '100', 10))
  @IsUUID('4', { each: true })
  invoiceIds: string[];

  @IsEmail()
  email: string;
}

