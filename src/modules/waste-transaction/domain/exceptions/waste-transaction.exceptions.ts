import { NotFoundException, BadRequestException } from '@nestjs/common';

export class WasteTransactionNotFoundException extends NotFoundException {
  constructor(wasteTransactionId: string) {
    super(`Waste transaction with ID ${wasteTransactionId} not found`);
  }
}

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} transaction with status ${currentStatus}`);
  }
}

export class InvalidCompanyException extends BadRequestException {
  constructor(companyId: string) {
    super(`Company with ID ${companyId} not found or invalid.`);
  }
}

export class InvalidHcfException extends BadRequestException {
  constructor(hcfId: string) {
    super(`HCF with ID ${hcfId} not found or invalid.`);
  }
}
