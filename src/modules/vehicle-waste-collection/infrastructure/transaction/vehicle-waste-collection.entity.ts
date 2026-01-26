import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VehicleWasteCollectionStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  VERIFIED = 'Verified',
}

@Entity('vehicle_waste_collections')
@Index(['vehicleId', 'collectionDate'], { unique: true, where: 'is_deleted = false' })
@Index(['collectionDate'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
export class VehicleWasteCollectionEntity {
  @PrimaryColumn({ type: 'uuid', name: 'vehicle_waste_collection_id' })
  vehicleWasteCollectionId: string;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'date', name: 'collection_date' })
  collectionDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'gross_weight_kg' })
  grossWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tare_weight_kg' })
  tareWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'net_weight_kg' })
  netWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'incineration_weight_kg' })
  incinerationWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'autoclave_weight_kg' })
  autoclaveWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'vehicle_km', nullable: true })
  vehicleKm: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'fuel_usage_liters', nullable: true })
  fuelUsageLiters: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'status',
    default: VehicleWasteCollectionStatus.DRAFT,
  })
  status: VehicleWasteCollectionStatus;

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
