import { NotFoundException, ConflictException } from '@nestjs/common';

export class HcfNotFoundException extends NotFoundException {
  constructor(hcfId: string) {
    super(`HCF with ID ${hcfId} not found`);
  }
}

export class DuplicateHcfCodeException extends ConflictException {
  constructor(hcfCode: string) {
    super(`HCF with code "${hcfCode}" already exists for this company`);
  }
}
