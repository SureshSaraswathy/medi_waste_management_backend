import { Injectable, Inject } from '@nestjs/common';
import { IAgreementClauseRepository, AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClause } from '../../domain/entities/agreement-clause.domain.entity';

@Injectable()
export class GetAllAgreementClausesUseCase {
  constructor(
    @Inject(AGREEMENT_CLAUSE_REPOSITORY_TOKEN)
    private readonly repository: IAgreementClauseRepository,
  ) {}

  async execute(agreementId?: string, status?: string): Promise<AgreementClause[]> {
    return this.repository.findAll(agreementId, status);
  }
}
