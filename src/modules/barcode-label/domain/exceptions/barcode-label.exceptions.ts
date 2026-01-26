import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export class BarcodeLabelNotFoundException extends NotFoundException {
  constructor(barcodeLabelId: string) {
    super(`Barcode label with ID ${barcodeLabelId} not found`);
  }
}

export class DuplicateBarcodeValueException extends ConflictException {
  constructor(barcodeValue: string) {
    super(`Barcode value ${barcodeValue} already exists. Each barcode must be unique.`);
  }
}

export class DuplicateSequenceException extends ConflictException {
  constructor(hcfCode: string, barcodeType: string, sequenceNumber: number) {
    super(`Sequence number ${sequenceNumber} already exists for HCF ${hcfCode} and type ${barcodeType}.`);
  }
}

export class InvalidHcfException extends BadRequestException {
  constructor(hcfId: string) {
    super(`HCF with ID ${hcfId} not found or invalid.`);
  }
}

export class InvalidCompanyException extends BadRequestException {
  constructor(companyId: string) {
    super(`Company with ID ${companyId} not found or invalid.`);
  }
}
