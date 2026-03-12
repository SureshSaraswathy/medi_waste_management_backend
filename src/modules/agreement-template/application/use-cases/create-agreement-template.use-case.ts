import { Injectable, Inject } from '@nestjs/common';
import { IAgreementTemplateRepository, AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-template.repository.interface';
import { AgreementTemplate } from '../../domain/entities/agreement-template.domain.entity';
import { CreateAgreementTemplateDto } from '../dto/create-agreement-template.dto';
import { DuplicateTemplateCodeException } from '../../domain/exceptions/agreement-template.exceptions';
import { randomUUID } from 'crypto';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class CreateAgreementTemplateUseCase {
  constructor(
    @Inject(AGREEMENT_TEMPLATE_REPOSITORY_TOKEN)
    private readonly templateRepository: IAgreementTemplateRepository,
  ) {}

  async execute(createDto: CreateAgreementTemplateDto, createdBy?: string): Promise<AgreementTemplate> {
    // Auto-generate template code
    const templateCode = await this.generateTemplateCode();

    const template = AgreementTemplate.create({
      templateId: randomUUID(),
      templateCode,
      templateName: createDto.templateName,
      agreementCategory: createDto.agreementCategory || null,
      templateDescription: createDto.templateDescription || null,
      templateContent: null, // Removed - content is stored in Agreement Clause module
      status: createDto.status || MasterStatus.ACTIVE,
      createdBy: createdBy || null,
    });

    return this.templateRepository.create(template);
  }

  private async generateTemplateCode(): Promise<string> {
    const prefix = 'AGR-TMP';
    const lastCode = await this.templateRepository.findLastTemplateCode();
    
    if (!lastCode || !lastCode.startsWith(prefix)) {
      return `${prefix}001`;
    }
    
    // Extract sequence number from last code (e.g., AGR-TMP001 -> 001)
    const sequenceStr = lastCode.replace(prefix, '');
    const sequenceNum = parseInt(sequenceStr, 10);
    
    if (isNaN(sequenceNum)) {
      return `${prefix}001`;
    }
    
    const nextSequence = sequenceNum + 1;
    const nextSequenceStr = nextSequence.toString().padStart(3, '0');
    
    return `${prefix}${nextSequenceStr}`;
  }
}
