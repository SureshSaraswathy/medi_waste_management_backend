import { Injectable, Inject } from '@nestjs/common';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendmentNotFoundException } from '../../domain/exceptions/hcf-amendment.exceptions';

@Injectable()
export class DeleteHcfAmendmentUseCase {
  constructor(
    @Inject(HCF_AMENDMENT_REPOSITORY_TOKEN)
    private readonly hcfAmendmentRepository: IHcfAmendmentRepository,
  ) {}

  async execute(hcfAmendmentId: string, modifiedBy?: string): Promise<void> {
    const hcfAmendment = await this.hcfAmendmentRepository.findById(hcfAmendmentId);
    if (!hcfAmendment) {
      throw new HcfAmendmentNotFoundException(hcfAmendmentId);
    }

    hcfAmendment.softDelete(modifiedBy || null);
    await this.hcfAmendmentRepository.softDelete(hcfAmendmentId);
  }
}
