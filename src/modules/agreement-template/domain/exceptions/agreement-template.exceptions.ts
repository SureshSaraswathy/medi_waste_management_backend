import { NotFoundException, ConflictException } from '@nestjs/common';

export class AgreementTemplateNotFoundException extends NotFoundException {
  constructor(templateId: string) {
    super(`Agreement template with ID ${templateId} not found`);
  }
}

export class DuplicateTemplateCodeException extends ConflictException {
  constructor(templateCode: string) {
    super(`Agreement template with code "${templateCode}" already exists`);
  }
}
