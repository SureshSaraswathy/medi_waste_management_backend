import { BadRequestException, NotFoundException } from '@nestjs/common';

export class DuplicateCertificateNoException extends BadRequestException {
  constructor(certificateNo: string) {
    super(`Certificate number ${certificateNo} already exists`);
  }
}

export class TrainingCertificateNotFoundException extends NotFoundException {
  constructor(certificateId: string) {
    super(`Training certificate with ID ${certificateId} not found`);
  }
}
