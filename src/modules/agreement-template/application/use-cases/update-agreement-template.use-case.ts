import { Injectable, Inject } from '@nestjs/common';
import { IAgreementTemplateRepository, AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-template.repository.interface';
import { AgreementTemplate } from '../../domain/entities/agreement-template.domain.entity';
import { UpdateAgreementTemplateDto } from '../dto/update-agreement-template.dto';
import { AgreementTemplateNotFoundException, DuplicateTemplateCodeException } from '../../domain/exceptions/agreement-template.exceptions';

@Injectable()
export class UpdateAgreementTemplateUseCase {
  constructor(
    @Inject(AGREEMENT_TEMPLATE_REPOSITORY_TOKEN)
    private readonly templateRepository: IAgreementTemplateRepository,
  ) {}

  async execute(templateId: string, updateDto: UpdateAgreementTemplateDto, modifiedBy?: string): Promise<AgreementTemplate> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new AgreementTemplateNotFoundException(templateId);
    }

    // Template code is auto-generated and cannot be updated
    template.update({
      templateName: updateDto.templateName,
      agreementCategory: updateDto.agreementCategory,
      templateDescription: updateDto.templateDescription,
      templateContent: null, // Removed - content is stored in Agreement Clause module
      status: updateDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.templateRepository.update(templateId, template);
  }
}
