import { Injectable, Inject } from '@nestjs/common';
import { IHcfTypeRepository, HCF_TYPE_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-type.repository.interface';
import { HcfType } from '../../domain/entities/hcf-type.domain.entity';
import { UpdateHcfTypeDto } from '../dto/update-hcf-type.dto';
import { HcfTypeNotFoundException } from '../../domain/exceptions/hcf-type.exceptions';

@Injectable()
export class UpdateHcfTypeUseCase {
  constructor(
    @Inject(HCF_TYPE_REPOSITORY_TOKEN)
    private readonly hcfTypeRepository: IHcfTypeRepository,
  ) {}

  async execute(hcfTypeId: string, updateHcfTypeDto: UpdateHcfTypeDto, modifiedBy?: string): Promise<HcfType> {
    const hcfType = await this.hcfTypeRepository.findById(hcfTypeId);
    if (!hcfType) {
      throw new HcfTypeNotFoundException(hcfTypeId);
    }

    hcfType.update({
      status: updateHcfTypeDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.hcfTypeRepository.update(hcfTypeId, hcfType);
  }
}
