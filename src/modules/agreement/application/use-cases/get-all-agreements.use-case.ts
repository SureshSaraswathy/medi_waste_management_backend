import { Injectable, Inject } from '@nestjs/common';
import { IAgreementRepository, AGREEMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement.repository.interface';
import { Agreement } from '../../domain/entities/agreement.domain.entity';

@Injectable()
export class GetAllAgreementsUseCase {
  constructor(
    @Inject(AGREEMENT_REPOSITORY_TOKEN)
    private readonly repository: IAgreementRepository,
  ) {}

  async execute(contractId?: string, status?: string): Promise<Agreement[]> {
    return this.repository.findAll(contractId, status);
  }
}
