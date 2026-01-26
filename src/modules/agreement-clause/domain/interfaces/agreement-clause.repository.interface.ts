import { AgreementClause } from '../entities/agreement-clause.domain.entity';

export const AGREEMENT_CLAUSE_REPOSITORY_TOKEN = 'AGREEMENT_CLAUSE_REPOSITORY';

export interface IAgreementClauseRepository {
  findAll(agreementId?: string, status?: string): Promise<AgreementClause[]>;
  findOne(id: string): Promise<AgreementClause | null>;
  create(clause: AgreementClause): Promise<AgreementClause>;
  update(clause: AgreementClause): Promise<AgreementClause>;
  updateSequence(id: string, newSequenceNo: number): Promise<AgreementClause>;
  delete(id: string, modifiedBy?: string | null): Promise<void>;
}
