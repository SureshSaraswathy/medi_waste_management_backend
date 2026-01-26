import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { HcfNotFoundException } from '../../domain/exceptions/hcf.exceptions';

@Injectable()
export class DeleteHcfUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
  ) {}

  async execute(hcfId: string, modifiedBy?: string): Promise<void> {
    const hcf = await this.hcfRepository.findById(hcfId);
    if (!hcf) {
      throw new HcfNotFoundException(hcfId);
    }

    hcf.softDelete(modifiedBy || null);
    await this.hcfRepository.softDelete(hcfId);
  }
}
