import { Agreement } from '../entities/agreement.domain.entity';

export const AGREEMENT_REPOSITORY_TOKEN = 'AGREEMENT_REPOSITORY';

export interface IAgreementRepository {
  findAll(contractId?: string, status?: string): Promise<Agreement[]>;
  findOne(id: string): Promise<Agreement | null>;
  create(agreement: Agreement): Promise<Agreement>;
  update(agreement: Agreement): Promise<Agreement>;
  delete(id: string, modifiedBy?: string | null): Promise<void>;
}
