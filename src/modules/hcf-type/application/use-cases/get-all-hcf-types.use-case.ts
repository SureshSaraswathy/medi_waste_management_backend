import { Injectable, Inject } from '@nestjs/common';
import { IHcfTypeRepository, HCF_TYPE_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-type.repository.interface';
import { HcfType } from '../../domain/entities/hcf-type.domain.entity';

@Injectable()
export class GetAllHcfTypesUseCase {
  constructor(
    @Inject(HCF_TYPE_REPOSITORY_TOKEN)
    private readonly hcfTypeRepository: IHcfTypeRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<HcfType[]> {
    if (companyId) {
      return this.hcfTypeRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.hcfTypeRepository.findAllActive();
    }
    return this.hcfTypeRepository.findAll();
  }
}
