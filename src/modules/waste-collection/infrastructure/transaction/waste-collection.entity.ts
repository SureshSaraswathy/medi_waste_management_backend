import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CollectionStatus {
  PENDING = 'Pending',
  COLLECTED = 'Collected',
  IN_TRANSIT = 'In Transit',
  PROCESSED = 'Processed',
  DISPOSED = 'Disposed',
}

export enum WasteColor {
  YELLOW = 'Yellow',
  RED = 'Red',
  WHITE = 'White',
}

@Entity('waste_collections')
@Index(['barcode', 'collectionDate'], { unique: true, where: 'is_deleted = false' })
@Index(['collectionDate'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['hcfId', 'collectionDate'], { where: 'is_deleted = false' })
@Index(['companyId', 'collectionDate'], { where: 'is_deleted = false' })
export class WasteCollectionEntity {
  @PrimaryColumn({ type: 'uuid', name: 'waste_collection_id' })
  wasteCollectionId: string;

  @Column({ type: 'varchar', length: 50, name: 'barcode', unique: false })
  barcode: string;

  @Column({ type: 'date', name: 'collection_date' })
  collectionDate: Date;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'hcf_id' })
  hcfId: string;

  @Column({ type: 'varchar', length: 20, name: 'waste_color' })
  wasteColor: WasteColor;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'weight_kg', nullable: true })
  weightKg: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: CollectionStatus.PENDING,
  })
  status: CollectionStatus;

  @Column({ type: 'uuid', name: 'route_assignment_id', nullable: true })
  routeAssignmentId: string | null;

  @Column({ type: 'uuid', name: 'collected_by', nullable: true })
  collectedBy: string | null;

  @Column({ type: 'timestamp', name: 'collected_at', nullable: true })
  collectedAt: Date | null;

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

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;
}
