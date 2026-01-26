import { Injectable, Inject } from '@nestjs/common';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendment } from '../../domain/entities/hcf-amendment.domain.entity';
import { CreateHcfAmendmentDto } from '../dto/create-hcf-amendment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateHcfAmendmentUseCase {
  constructor(
    @Inject(HCF_AMENDMENT_REPOSITORY_TOKEN)
    private readonly hcfAmendmentRepository: IHcfAmendmentRepository,
  ) {}

  async execute(createHcfAmendmentDto: CreateHcfAmendmentDto, createdBy?: string): Promise<HcfAmendment> {
    const hcfAmendment = HcfAmendment.create({
      hcfAmendmentId: randomUUID(),
      hcfId: createHcfAmendmentDto.hcfId,
      amendmentType: createHcfAmendmentDto.amendmentType,
      amendmentDate: createHcfAmendmentDto.amendmentDate,
      description: createHcfAmendmentDto.description,
      status: createHcfAmendmentDto.status,
      approvedBy: createHcfAmendmentDto.approvedBy,
      approvedDate: createHcfAmendmentDto.approvedDate,
      createdBy: createdBy || null,
    });

    return this.hcfAmendmentRepository.create(hcfAmendment);
  }
}
