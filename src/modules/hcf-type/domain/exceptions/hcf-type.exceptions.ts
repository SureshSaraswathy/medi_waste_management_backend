import { NotFoundException, ConflictException } from '@nestjs/common';

export class HcfTypeNotFoundException extends NotFoundException {
  constructor(hcfTypeId: string) {
    super(`HCF Type with ID ${hcfTypeId} not found`);
  }
}

export class DuplicateHcfTypeCodeException extends ConflictException {
  constructor(hcfTypeCode: string) {
    super(`HCF Type with code "${hcfTypeCode}" already exists for this company`);
  }
}

export class DuplicateHcfTypeNameException extends ConflictException {
  constructor(hcfTypeName: string) {
    super(`HCF Type with name "${hcfTypeName}" already exists for this company`);
  }
}
