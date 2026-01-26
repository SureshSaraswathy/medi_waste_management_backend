import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Frequency } from '../entities/frequency.domain.entity';

export const FREQUENCY_REPOSITORY_TOKEN = 'FREQUENCY_REPOSITORY';

export interface IFrequencyRepository extends IBaseMasterRepository<Frequency> {
  findByFrequencyCode(frequencyCode: string, companyId: string): Promise<Frequency | null>;
  findByFrequencyName(frequencyName: string, companyId: string): Promise<Frequency | null>;
  findByCompany(companyId: string): Promise<Frequency[]>;
}
