import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export class WasteProcessNotFoundException extends NotFoundException {
  constructor(wasteProcessId: string) {
    super(`Waste process with ID ${wasteProcessId} not found`);
  }
}

export class DuplicateWasteProcessException extends ConflictException {
  constructor(companyId: string, processDate: string) {
    super(`A waste process already exists for company ${companyId} on ${processDate}. Only one process per company per date is allowed.`);
  }
}

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} process with status ${currentStatus}`);
  }
}

export class InvalidCompanyException extends BadRequestException {
  constructor(companyId: string) {
    super(`Company with ID ${companyId} not found or invalid.`);
  }
}

export class InvalidWeightException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
