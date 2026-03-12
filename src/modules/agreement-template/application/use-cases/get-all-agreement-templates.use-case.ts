import { Injectable, Inject } from '@nestjs/common';
import { IAgreementTemplateRepository, AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-template.repository.interface';
import { AgreementTemplate } from '../../domain/entities/agreement-template.domain.entity';

@Injectable()
export class GetAllAgreementTemplatesUseCase {
  constructor(
    @Inject(AGREEMENT_TEMPLATE_REPOSITORY_TOKEN)
    private readonly templateRepository: IAgreementTemplateRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<AgreementTemplate[]> {
    if (activeOnly) {
      return this.templateRepository.findAllActive();
    }
    return this.templateRepository.findAll();
  }
}
