import { Contract } from '../entities/contract.domain.entity';

export const CONTRACT_REPOSITORY_TOKEN = 'CONTRACT_REPOSITORY';

export interface IContractRepository {
  findAll(companyId?: string, status?: string): Promise<Contract[]>;
  findOne(id: string): Promise<Contract | null>;
  create(contract: Contract): Promise<Contract>;
  update(contract: Contract): Promise<Contract>;
  delete(id: string, modifiedBy?: string | null): Promise<void>;
}
