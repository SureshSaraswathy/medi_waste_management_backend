import { RouteAssignmentStatus } from '../../infrastructure/transaction/route-assignment.entity';

export class RouteAssignment {
  private constructor(
    public readonly id: string,
    public readonly assignmentDate: Date,
    public readonly routeId: string,
    public readonly vehicleId: string,
    public readonly driverId: string,
    public readonly pickerId: string | null,
    public readonly supervisorId: string | null,
    public readonly companyId: string,
    public status: RouteAssignmentStatus,
    public notes: string | null,
    public readonly createdBy: string | null,
    public readonly createdOn: Date,
    public modifiedBy: string | null,
    public modifiedOn: Date,
    public readonly isDeleted: boolean,
  ) {}

  static create(params: {
    routeAssignmentId: string;
    assignmentDate: Date;
    routeId: string;
    vehicleId: string;
    driverId: string;
    pickerId?: string | null;
    supervisorId?: string | null;
    companyId: string;
    status?: RouteAssignmentStatus;
    notes?: string | null;
    createdBy?: string | null;
  }): RouteAssignment {
    const now = new Date();
    return new RouteAssignment(
      params.routeAssignmentId,
      params.assignmentDate,
      params.routeId,
      params.vehicleId,
      params.driverId,
      params.pickerId || null,
      params.supervisorId || null,
      params.companyId,
      params.status || RouteAssignmentStatus.DRAFT,
      params.notes || null,
      params.createdBy || null,
      now,
      null,
      now,
      false,
    );
  }

  static reconstitute(data: {
    routeAssignmentId: string;
    assignmentDate: Date;
    routeId: string;
    vehicleId: string;
    driverId: string;
    pickerId: string | null;
    supervisorId: string | null;
    companyId: string;
    status: RouteAssignmentStatus;
    notes: string | null;
    createdBy: string | null;
    createdOn: Date;
    modifiedBy: string | null;
    modifiedOn: Date;
    isDeleted: boolean;
  }): RouteAssignment {
    return new RouteAssignment(
      data.routeAssignmentId,
      data.assignmentDate,
      data.routeId,
      data.vehicleId,
      data.driverId,
      data.pickerId,
      data.supervisorId,
      data.companyId,
      data.status,
      data.notes,
      data.createdBy,
      data.createdOn,
      data.modifiedBy,
      data.modifiedOn,
      data.isDeleted,
    );
  }

  update(params: {
    status?: RouteAssignmentStatus;
    pickerId?: string | null;
    supervisorId?: string | null;
    notes?: string | null;
    modifiedBy?: string | null;
  }): void {
    if (params.status !== undefined) {
      this.status = params.status;
    }
    if (params.pickerId !== undefined) {
      (this as any).pickerId = params.pickerId;
    }
    if (params.supervisorId !== undefined) {
      (this as any).supervisorId = params.supervisorId;
    }
    if (params.notes !== undefined) {
      this.notes = params.notes;
    }
    this.modifiedBy = params.modifiedBy || null;
    this.modifiedOn = new Date();
  }

  canEdit(): boolean {
    return this.status === RouteAssignmentStatus.DRAFT || this.status === RouteAssignmentStatus.ASSIGNED;
  }

  canStart(): boolean {
    return this.status === RouteAssignmentStatus.ASSIGNED;
  }

  canComplete(): boolean {
    return this.status === RouteAssignmentStatus.IN_PROGRESS;
  }

  get routeAssignmentId(): string {
    return this.id;
  }
}
