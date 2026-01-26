import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';

export class InvoiceNotFoundException extends NotFoundException {
  constructor(invoiceId?: string) {
    super(`Invoice ${invoiceId ? `with ID ${invoiceId}` : ''} not found`);
  }
}

export class DuplicateInvoiceException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}

export class InvoiceLockedException extends ForbiddenException {
  constructor(message: string = 'Invoice is locked and cannot be modified') {
    super(message);
  }
}

export class InvalidInvoiceDataException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class MissingHcfBillingDataException extends BadRequestException {
  constructor(hcfId: string, message: string) {
    super(`HCF ${hcfId}: ${message}`);
  }
}
