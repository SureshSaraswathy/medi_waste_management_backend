import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { Hcf } from '../../domain/entities/hcf.domain.entity';
import { HcfNotFoundException } from '../../domain/exceptions/hcf.exceptions';

@Injectable()
export class GetHcfUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
  ) {}

  async execute(hcfId: string): Promise<Hcf> {
    const hcf = await this.hcfRepository.findById(hcfId);
    if (!hcf) {
      throw new HcfNotFoundException(hcfId);
    }
    return hcf;
  }
}
