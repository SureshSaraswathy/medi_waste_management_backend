import { Injectable, Inject } from '@nestjs/common';
import { IAgreementRepository, AGREEMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement.repository.interface';
import { Agreement } from '../../domain/entities/agreement.domain.entity';
import { AgreementNotFoundException } from '../../domain/exceptions/agreement.exceptions';

@Injectable()
export class GetAgreementUseCase {
  constructor(
    @Inject(AGREEMENT_REPOSITORY_TOKEN)
    private readonly repository: IAgreementRepository,
  ) {}

  async execute(id: string): Promise<Agreement> {
    const agreement = await this.repository.findOne(id);
    if (!agreement) {
      throw new AgreementNotFoundException(id);
    }
    return agreement;
  }
}
