import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export class VehicleWasteCollectionNotFoundException extends NotFoundException {
  constructor(vehicleWasteCollectionId: string) {
    super(`Vehicle waste collection with ID ${vehicleWasteCollectionId} not found`);
  }
}

export class DuplicateVehicleCollectionException extends ConflictException {
  constructor(vehicleId: string, collectionDate: string) {
    super(`A waste collection already exists for vehicle ${vehicleId} on ${collectionDate}. Only one collection per vehicle per date is allowed.`);
  }
}

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} collection with status ${currentStatus}`);
  }
}

export class InvalidVehicleException extends BadRequestException {
  constructor(vehicleId: string) {
    super(`Vehicle with ID ${vehicleId} not found or invalid.`);
  }
}

export class InvalidWeightException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
