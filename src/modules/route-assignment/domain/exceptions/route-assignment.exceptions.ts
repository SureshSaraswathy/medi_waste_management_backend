import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export class RouteAssignmentNotFoundException extends NotFoundException {
  constructor(routeAssignmentId: string) {
    super(`Route assignment with ID ${routeAssignmentId} not found`);
  }
}

export class DuplicateVehicleAssignmentException extends ConflictException {
  constructor(vehicleId: string, date: string) {
    super(`Vehicle is already assigned on ${date}. A vehicle can only be assigned once per day.`);
  }
}

export class DuplicateDriverAssignmentException extends ConflictException {
  constructor(driverId: string, date: string) {
    super(`Driver is already assigned on ${date}. A driver can only be assigned once per day.`);
  }
}

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(currentStatus: string, newStatus: string) {
    super(`Cannot transition from status "${currentStatus}" to "${newStatus}". Invalid status transition.`);
  }
}

export class RouteAssignmentReadOnlyException extends BadRequestException {
  constructor(status: string) {
    super(`Route assignment cannot be modified when status is "${status}". Only Draft and Assigned assignments can be edited.`);
  }
}
