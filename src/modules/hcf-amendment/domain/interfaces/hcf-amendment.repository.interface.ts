import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { HcfAmendment } from '../entities/hcf-amendment.domain.entity';

export const HCF_AMENDMENT_REPOSITORY_TOKEN = 'HCF_AMENDMENT_REPOSITORY';

export interface IHcfAmendmentRepository extends IBaseMasterRepository<HcfAmendment> {
  findByHcf(hcfId: string): Promise<HcfAmendment[]>;
}
