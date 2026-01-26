import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { Hcf } from '../../domain/entities/hcf.domain.entity';

@Injectable()
export class GetAllHcfsUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<Hcf[]> {
    if (companyId) {
      return this.hcfRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.hcfRepository.findAllActive();
    }
    return this.hcfRepository.findAll();
  }
}
