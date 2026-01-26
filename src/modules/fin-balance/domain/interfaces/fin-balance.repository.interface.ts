import { FinBalance } from '../entities/fin-balance.domain.entity';

export const FIN_BALANCE_REPOSITORY_TOKEN = 'FIN_BALANCE_REPOSITORY';

export interface IFinBalanceRepository {
  create(finBalance: FinBalance): Promise<FinBalance>;
  findById(finBalanceId: string): Promise<FinBalance | null>;
  findByCompany(companyId: string): Promise<FinBalance[]>;
  findByHcf(hcfId: string): Promise<FinBalance | null>;
  findByCompanyAndHcf(companyId: string, hcfId: string): Promise<FinBalance | null>;
  findAll(): Promise<FinBalance[]>;
  update(finBalance: FinBalance): Promise<FinBalance>;
  delete(finBalanceId: string, deletedBy?: string | null): Promise<void>;
  bulkCreate(finBalances: FinBalance[]): Promise<FinBalance[]>;
  bulkUpdate(finBalances: FinBalance[]): Promise<FinBalance[]>;
}
