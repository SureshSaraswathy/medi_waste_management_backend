import { Injectable, Inject } from '@nestjs/common';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendment } from '../../domain/entities/hcf-amendment.domain.entity';

@Injectable()
export class GetAllHcfAmendmentsUseCase {
  constructor(
    @Inject(HCF_AMENDMENT_REPOSITORY_TOKEN)
    private readonly hcfAmendmentRepository: IHcfAmendmentRepository,
  ) {}

  async execute(hcfId?: string, activeOnly: boolean = false): Promise<HcfAmendment[]> {
    if (hcfId) {
      return this.hcfAmendmentRepository.findByHcf(hcfId);
    }
    if (activeOnly) {
      return this.hcfAmendmentRepository.findAllActive();
    }
    return this.hcfAmendmentRepository.findAll();
  }
}
