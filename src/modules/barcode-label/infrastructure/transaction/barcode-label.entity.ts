import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BarcodeType {
  BARCODE = 'Barcode',
  QR_CODE = 'QR Code',
}

export enum ColorBlock {
  YELLOW = 'Yellow',
  RED = 'Red',
  WHITE = 'White',
}

@Entity('barcode_labels')
@Index(['hcfCode', 'barcodeType', 'sequenceNumber'], { unique: true, where: 'is_deleted = false' })
@Index(['companyId', 'hcfId'], { where: 'is_deleted = false' })
@Index(['barcodeValue'], { unique: true, where: 'is_deleted = false' })
export class BarcodeLabelEntity {
  @PrimaryColumn({ type: 'uuid', name: 'barcode_label_id' })
  barcodeLabelId: string;

  @Column({ type: 'varchar', length: 50, name: 'hcf_code' })
  hcfCode: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'integer', name: 'sequence_number' })
  sequenceNumber: number;

  @Column({ type: 'varchar', length: 50, name: 'barcode_value', unique: true })
  barcodeValue: string;

  @Column({ type: 'varchar', length: 20, name: 'barcode_type' })
  barcodeType: BarcodeType;

  @Column({ type: 'varchar', length: 20, name: 'color_block' })
  colorBlock: ColorBlock;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'uuid', name: 'modified_by', nullable: true })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
