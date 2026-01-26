import { Injectable, Inject } from '@nestjs/common';
import { IAgreementClauseRepository, AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClause } from '../../domain/entities/agreement-clause.domain.entity';
import { AgreementClauseNotFoundException } from '../../domain/exceptions/agreement-clause.exceptions';

@Injectable()
export class GetAgreementClauseUseCase {
  constructor(
    @Inject(AGREEMENT_CLAUSE_REPOSITORY_TOKEN)
    private readonly repository: IAgreementClauseRepository,
  ) {}

  async execute(id: string): Promise<AgreementClause> {
    const clause = await this.repository.findOne(id);
    if (!clause) {
      throw new AgreementClauseNotFoundException(id);
    }
    return clause;
  }
}
