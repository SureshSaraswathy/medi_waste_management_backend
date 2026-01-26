import { NotFoundException } from '@nestjs/common';

export class HcfAmendmentNotFoundException extends NotFoundException {
  constructor(hcfAmendmentId: string) {
    super(`HCF Amendment with ID ${hcfAmendmentId} not found`);
  }
}
