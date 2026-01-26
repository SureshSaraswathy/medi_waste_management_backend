import { NotFoundException, ConflictException } from '@nestjs/common';

export class FleetNotFoundException extends NotFoundException {
  constructor(fleetId: string) {
    super(`Fleet with ID ${fleetId} not found`);
  }
}

export class DuplicateVehicleNumException extends ConflictException {
  constructor(vehicleNum: string) {
    super(`Fleet with vehicle number "${vehicleNum}" already exists for this company`);
  }
}
