import { Injectable, Inject } from '@nestjs/common';
import { IAgreementClauseRepository, AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClauseNotFoundException } from '../../domain/exceptions/agreement-clause.exceptions';
import { ReorderClauseDto } from '../dto/reorder-clause.dto';

@Injectable()
export class ReorderAgreementClauseUseCase {
  constructor(
    @Inject(AGREEMENT_CLAUSE_REPOSITORY_TOKEN)
    private readonly repository: IAgreementClauseRepository,
  ) {}

  async execute(id: string, dto: ReorderClauseDto, modifiedBy?: string | null): Promise<void> {
    const clause = await this.repository.findOne(id);
    if (!clause) {
      throw new AgreementClauseNotFoundException(id);
    }

    // Get all clauses for the same agreement
    const allClauses = await this.repository.findAll(clause.agreementId);
    
    // Find the clause that currently has the target sequence number
    const targetClause = allClauses.find(c => c.sequenceNo === dto.newSequenceNo && c.clauseId !== id);
    
    if (targetClause) {
      // Swap sequence numbers
      const oldSequenceNo = clause.sequenceNo;
      await this.repository.updateSequence(clause.clauseId, dto.newSequenceNo);
      await this.repository.updateSequence(targetClause.clauseId, oldSequenceNo);
    } else {
      // Just update the sequence number
      await this.repository.updateSequence(clause.clauseId, dto.newSequenceNo);
    }
  }
}
