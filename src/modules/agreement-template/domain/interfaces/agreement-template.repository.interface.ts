import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { AgreementTemplate } from '../entities/agreement-template.domain.entity';

export const AGREEMENT_TEMPLATE_REPOSITORY_TOKEN = 'AGREEMENT_TEMPLATE_REPOSITORY';

export interface IAgreementTemplateRepository extends IBaseMasterRepository<AgreementTemplate> {
  findByTemplateCode(templateCode: string): Promise<AgreementTemplate | null>;
  findLastTemplateCode(): Promise<string | null>;
}
