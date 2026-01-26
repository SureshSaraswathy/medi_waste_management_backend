import { Injectable, Inject } from '@nestjs/common';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendment } from '../../domain/entities/hcf-amendment.domain.entity';
import { HcfAmendmentNotFoundException } from '../../domain/exceptions/hcf-amendment.exceptions';

@Injectable()
export class GetHcfAmendmentUseCase {
  constructor(
    @Inject(HCF_AMENDMENT_REPOSITORY_TOKEN)
    private readonly hcfAmendmentRepository: IHcfAmendmentRepository,
  ) {}

  async execute(hcfAmendmentId: string): Promise<HcfAmendment> {
    const hcfAmendment = await this.hcfAmendmentRepository.findById(hcfAmendmentId);
    if (!hcfAmendment) {
      throw new HcfAmendmentNotFoundException(hcfAmendmentId);
    }
    return hcfAmendment;
  }
}
