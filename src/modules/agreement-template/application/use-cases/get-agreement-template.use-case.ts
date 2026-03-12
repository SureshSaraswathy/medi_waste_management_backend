import { Injectable, Inject } from '@nestjs/common';
import { IAgreementTemplateRepository, AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-template.repository.interface';
import { AgreementTemplate } from '../../domain/entities/agreement-template.domain.entity';
import { AgreementTemplateNotFoundException } from '../../domain/exceptions/agreement-template.exceptions';

@Injectable()
export class GetAgreementTemplateUseCase {
  constructor(
    @Inject(AGREEMENT_TEMPLATE_REPOSITORY_TOKEN)
    private readonly templateRepository: IAgreementTemplateRepository,
  ) {}

  async execute(templateId: string): Promise<AgreementTemplate> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new AgreementTemplateNotFoundException(templateId);
    }
    return template;
  }
}
