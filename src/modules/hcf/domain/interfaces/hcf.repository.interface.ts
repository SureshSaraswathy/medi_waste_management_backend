import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Hcf } from '../entities/hcf.domain.entity';

export const HCF_REPOSITORY_TOKEN = 'HCF_REPOSITORY';

export interface IHcfRepository extends IBaseMasterRepository<Hcf> {
  findByHcfCode(hcfCode: string, companyId: string): Promise<Hcf | null>;
  findByCompany(companyId: string): Promise<Hcf[]>;
  // Authentication-related methods
  findByCode(hcfCode: string): Promise<Hcf | null>;
  findByCodeOrEmail(identifier: string): Promise<Hcf | null>;
  findByResetToken(token: string): Promise<Hcf | null>;
}
