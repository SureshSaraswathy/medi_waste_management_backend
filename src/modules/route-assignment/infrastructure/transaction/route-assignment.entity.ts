import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RouteAssignmentStatus {
  DRAFT = 'Draft',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

@Entity('route_assignments')
@Index(['assignmentDate', 'vehicleId'], { where: 'is_deleted = false' })
@Index(['assignmentDate', 'driverId'], { where: 'is_deleted = false' })
@Index(['assignmentDate', 'routeId'], { where: 'is_deleted = false' })
@Index(['status'], { where: 'is_deleted = false' })
export class RouteAssignmentEntity {
  @PrimaryColumn({ type: 'uuid', name: 'route_assignment_id' })
  routeAssignmentId: string;

  @Column({ type: 'date', name: 'assignment_date' })
  assignmentDate: Date;

  @Column({ type: 'uuid', name: 'route_id' })
  routeId: string;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'uuid', name: 'driver_id' })
  driverId: string;

  @Column({ type: 'uuid', name: 'picker_id', nullable: true })
  pickerId: string | null;

  @Column({ type: 'uuid', name: 'supervisor_id', nullable: true })
  supervisorId: string | null;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: RouteAssignmentStatus.DRAFT,
  })
  status: RouteAssignmentStatus;

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
