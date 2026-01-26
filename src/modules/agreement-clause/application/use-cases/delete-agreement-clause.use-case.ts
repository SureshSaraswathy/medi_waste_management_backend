import { Injectable, Inject } from '@nestjs/common';
import { IAgreementClauseRepository, AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClauseNotFoundException } from '../../domain/exceptions/agreement-clause.exceptions';

@Injectable()
export class DeleteAgreementClauseUseCase {
  constructor(
    @Inject(AGREEMENT_CLAUSE_REPOSITORY_TOKEN)
    private readonly repository: IAgreementClauseRepository,
  ) {}

  async execute(id: string, modifiedBy?: string | null): Promise<void> {
    const clause = await this.repository.findOne(id);
    if (!clause) {
      throw new AgreementClauseNotFoundException(id);
    }
    await this.repository.delete(id, modifiedBy);
  }
}
