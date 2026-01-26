import { NotFoundException, ConflictException } from '@nestjs/common';

export class FrequencyNotFoundException extends NotFoundException {
  constructor(frequencyId: string) {
    super(`Frequency with ID ${frequencyId} not found`);
  }
}

export class DuplicateFrequencyCodeException extends ConflictException {
  constructor(frequencyCode: string) {
    super(`Frequency with code "${frequencyCode}" already exists for this company`);
  }
}

export class DuplicateFrequencyNameException extends ConflictException {
  constructor(frequencyName: string) {
    super(`Frequency with name "${frequencyName}" already exists for this company`);
  }
}
