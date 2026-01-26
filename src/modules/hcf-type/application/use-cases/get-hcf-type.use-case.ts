import { Injectable, Inject } from '@nestjs/common';
import { IHcfTypeRepository, HCF_TYPE_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-type.repository.interface';
import { HcfType } from '../../domain/entities/hcf-type.domain.entity';
import { HcfTypeNotFoundException } from '../../domain/exceptions/hcf-type.exceptions';

@Injectable()
export class GetHcfTypeUseCase {
  constructor(
    @Inject(HCF_TYPE_REPOSITORY_TOKEN)
    private readonly hcfTypeRepository: IHcfTypeRepository,
  ) {}

  async execute(hcfTypeId: string): Promise<HcfType> {
    const hcfType = await this.hcfTypeRepository.findById(hcfTypeId);
    if (!hcfType) {
      throw new HcfTypeNotFoundException(hcfTypeId);
    }
    return hcfType;
  }
}
