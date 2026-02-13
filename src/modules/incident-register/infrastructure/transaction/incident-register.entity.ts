import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('incident_registers')
@Index(['companyId', 'incidentDate'], { where: 'is_deleted = false' })
@Index(['incidentNum'], { unique: true, where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
@Index(['incidentStatus'], { where: 'is_deleted = false' })
export class IncidentRegisterEntity {
  @PrimaryColumn({ type: 'uuid', name: 'incident_id' })
  incidentId: string;

  @Column({ type: 'varchar', length: 50, name: 'incident_num', unique: true })
  incidentNum: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'date', name: 'incident_date' })
  incidentDate: Date;

  @Column({ type: 'time', name: 'incident_time' })
  incidentTime: string;

  @Column({ type: 'varchar', length: 100, name: 'incident_type' })
  incidentType: string;

  @Column({ type: 'varchar', length: 255, name: 'location' })
  location: string;

  @Column({ type: 'varchar', length: 100, name: 'waste_category' })
  wasteCategory: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantity_value' })
  quantityValue: number;

  @Column({ type: 'varchar', length: 20, name: 'quantity_unit' })
  quantityUnit: string;

  @Column({ type: 'varchar', length: 20, name: 'severity' })
  severity: string;

  @Column({ type: 'varchar', length: 255, name: 'person_affected', nullable: true })
  personAffected: string | null;

  @Column({ type: 'text', name: 'immediate_action', nullable: true })
  immediateAction: string | null;

  @Column({ type: 'text', name: 'medical_action', nullable: true })
  medicalAction: string | null;

  @Column({ type: 'varchar', length: 255, name: 'reported_to', nullable: true })
  reportedTo: string | null;

  @Column({ type: 'varchar', length: 50, name: 'incident_status' })
  incidentStatus: string;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'Active' })
  status: 'Active' | 'Inactive';

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
