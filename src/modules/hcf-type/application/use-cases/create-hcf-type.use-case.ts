import { Injectable, Inject } from '@nestjs/common';
import { IHcfTypeRepository, HCF_TYPE_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-type.repository.interface';
import { HcfType } from '../../domain/entities/hcf-type.domain.entity';
import { CreateHcfTypeDto } from '../dto/create-hcf-type.dto';
import { DuplicateHcfTypeCodeException, DuplicateHcfTypeNameException } from '../../domain/exceptions/hcf-type.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateHcfTypeUseCase {
  constructor(
    @Inject(HCF_TYPE_REPOSITORY_TOKEN)
    private readonly hcfTypeRepository: IHcfTypeRepository,
  ) {}

  async execute(createHcfTypeDto: CreateHcfTypeDto, createdBy?: string): Promise<HcfType> {
    const existingByCode = await this.hcfTypeRepository.findByHcfTypeCode(
      createHcfTypeDto.hcfTypeCode,
      createHcfTypeDto.companyId,
    );
    if (existingByCode) {
      throw new DuplicateHcfTypeCodeException(createHcfTypeDto.hcfTypeCode);
    }

    const existingByName = await this.hcfTypeRepository.findByHcfTypeName(
      createHcfTypeDto.hcfTypeName,
      createHcfTypeDto.companyId,
    );
    if (existingByName) {
      throw new DuplicateHcfTypeNameException(createHcfTypeDto.hcfTypeName);
    }

    const hcfType = HcfType.create({
      hcfTypeId: randomUUID(),
      hcfTypeCode: createHcfTypeDto.hcfTypeCode,
      hcfTypeName: createHcfTypeDto.hcfTypeName,
      companyId: createHcfTypeDto.companyId,
      createdBy: createdBy || null,
    });

    return this.hcfTypeRepository.create(hcfType);
  }
}
