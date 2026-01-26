import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  VERIFIED = 'Verified',
}

export enum SegregationQuality {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
}

@Entity('waste_transactions')
@Index(['companyId', 'pickupDate'], { where: 'is_deleted = false' })
@Index(['hcfId', 'pickupDate'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['pickupDate'], { where: 'is_deleted = false' })
export class WasteTransactionEntity {
  @PrimaryColumn({ type: 'uuid', name: 'waste_transaction_id' })
  wasteTransactionId: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'date', name: 'pickup_date' })
  pickupDate: Date;

  @Column({ type: 'boolean', name: 'is_nil_pickup', default: false })
  isNilPickup: boolean;

  // Color-wise bag counts
  @Column({ type: 'integer', name: 'yellow_bag_count', default: 0 })
  yellowBagCount: number;

  @Column({ type: 'integer', name: 'red_bag_count', default: 0 })
  redBagCount: number;

  @Column({ type: 'integer', name: 'white_bag_count', default: 0 })
  whiteBagCount: number;

  @Column({ type: 'integer', name: 'blue_bag_count', default: 0 })
  blueBagCount: number;

  // Color-wise weights (in kg)
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'yellow_weight_kg', nullable: true })
  yellowWeightKg: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'red_weight_kg', nullable: true })
  redWeightKg: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'white_weight_kg', nullable: true })
  whiteWeightKg: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'blue_weight_kg', nullable: true })
  blueWeightKg: number | null;

  // GPS Location
  @Column({ type: 'decimal', precision: 10, scale: 8, name: 'latitude', nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, name: 'longitude', nullable: true })
  longitude: number | null;

  // Segregation Quality
  @Column({ type: 'varchar', length: 20, name: 'segregation_quality', nullable: true })
  segregationQuality: SegregationQuality | null;

  // Status
  @Column({
    type: 'varchar',
    length: 20,
    name: 'status',
    default: TransactionStatus.DRAFT,
  })
  status: TransactionStatus;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_on' })
  createdOn: Date;

  @Column({ type: 'uuid', name: 'modified_by', nullable: true })
  modifiedBy: string | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'modified_on' })
  modifiedOn: Date;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  verifiedBy: string | null;

  @Column({ type: 'timestamp', name: 'verified_on', nullable: true })
  verifiedOn: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
