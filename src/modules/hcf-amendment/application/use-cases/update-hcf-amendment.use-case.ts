import { Injectable, Inject } from '@nestjs/common';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendment } from '../../domain/entities/hcf-amendment.domain.entity';
import { UpdateHcfAmendmentDto } from '../dto/update-hcf-amendment.dto';
import { HcfAmendmentNotFoundException } from '../../domain/exceptions/hcf-amendment.exceptions';

@Injectable()
export class UpdateHcfAmendmentUseCase {
  constructor(
    @Inject(HCF_AMENDMENT_REPOSITORY_TOKEN)
    private readonly hcfAmendmentRepository: IHcfAmendmentRepository,
  ) {}

  async execute(hcfAmendmentId: string, updateHcfAmendmentDto: UpdateHcfAmendmentDto, modifiedBy?: string): Promise<HcfAmendment> {
    const hcfAmendment = await this.hcfAmendmentRepository.findById(hcfAmendmentId);
    if (!hcfAmendment) {
      throw new HcfAmendmentNotFoundException(hcfAmendmentId);
    }

    hcfAmendment.update({
      amendmentType: updateHcfAmendmentDto.amendmentType,
      amendmentDate: updateHcfAmendmentDto.amendmentDate,
      description: updateHcfAmendmentDto.description,
      status: updateHcfAmendmentDto.amendmentStatus,
      approvedBy: updateHcfAmendmentDto.approvedBy,
      approvedDate: updateHcfAmendmentDto.approvedDate,
      masterStatus: updateHcfAmendmentDto.masterStatus,
      modifiedBy: modifiedBy || null,
    });

    return this.hcfAmendmentRepository.update(hcfAmendmentId, hcfAmendment);
  }
}
