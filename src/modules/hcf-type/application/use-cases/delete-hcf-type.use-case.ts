import { Injectable, Inject } from '@nestjs/common';
import { IHcfTypeRepository, HCF_TYPE_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-type.repository.interface';
import { HcfTypeNotFoundException } from '../../domain/exceptions/hcf-type.exceptions';

@Injectable()
export class DeleteHcfTypeUseCase {
  constructor(
    @Inject(HCF_TYPE_REPOSITORY_TOKEN)
    private readonly hcfTypeRepository: IHcfTypeRepository,
  ) {}

  async execute(hcfTypeId: string, modifiedBy?: string): Promise<void> {
    const hcfType = await this.hcfTypeRepository.findById(hcfTypeId);
    if (!hcfType) {
      throw new HcfTypeNotFoundException(hcfTypeId);
    }

    hcfType.softDelete(modifiedBy || null);
    await this.hcfTypeRepository.softDelete(hcfTypeId);
  }
}
