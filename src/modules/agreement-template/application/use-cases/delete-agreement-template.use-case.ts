import { Injectable, Inject } from '@nestjs/common';
import { IAgreementTemplateRepository, AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-template.repository.interface';
import { AgreementTemplateNotFoundException } from '../../domain/exceptions/agreement-template.exceptions';

@Injectable()
export class DeleteAgreementTemplateUseCase {
  constructor(
    @Inject(AGREEMENT_TEMPLATE_REPOSITORY_TOKEN)
    private readonly templateRepository: IAgreementTemplateRepository,
  ) {}

  async execute(templateId: string, modifiedBy?: string): Promise<void> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new AgreementTemplateNotFoundException(templateId);
    }

    template.softDelete(modifiedBy || null);
    await this.templateRepository.softDelete(templateId);
  }
}
