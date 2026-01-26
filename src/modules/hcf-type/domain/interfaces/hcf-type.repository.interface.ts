import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { HcfType } from '../entities/hcf-type.domain.entity';

export const HCF_TYPE_REPOSITORY_TOKEN = 'HCF_TYPE_REPOSITORY';

export interface IHcfTypeRepository extends IBaseMasterRepository<HcfType> {
  findByHcfTypeCode(hcfTypeCode: string, companyId: string): Promise<HcfType | null>;
  findByHcfTypeName(hcfTypeName: string, companyId: string): Promise<HcfType | null>;
  findByCompany(companyId: string): Promise<HcfType[]>;
}
