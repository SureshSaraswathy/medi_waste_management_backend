import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export class WasteCollectionNotFoundException extends NotFoundException {
  constructor(wasteCollectionId: string) {
    super(`Waste collection with ID ${wasteCollectionId} not found`);
  }
}

export class DuplicateCollectionException extends ConflictException {
  constructor(barcode: string, date: string) {
    super(`Barcode ${barcode} has already been collected on ${date}. Each barcode can only be collected once per day.`);
  }
}

export class BarcodeNotFoundException extends NotFoundException {
  constructor(barcode: string) {
    super(`Barcode ${barcode} not found. Please verify the barcode and try again.`);
  }
}

export class InvalidBarcodeFormatException extends BadRequestException {
  constructor(barcode: string) {
    super(`Invalid barcode format: ${barcode}. Barcode must match the expected format.`);
  }
}

export class WasteCollectionReadOnlyException extends BadRequestException {
  constructor(status: string) {
    super(`Waste collection cannot be modified when status is "${status}". Only Pending and Collected collections can be edited.`);
  }
}
