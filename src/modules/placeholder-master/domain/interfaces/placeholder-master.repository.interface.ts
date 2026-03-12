import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { PlaceholderMaster } from '../entities/placeholder-master.domain.entity';

export const PLACEHOLDER_MASTER_REPOSITORY_TOKEN = 'PLACEHOLDER_MASTER_REPOSITORY';

export interface IPlaceholderMasterRepository extends IBaseMasterRepository<PlaceholderMaster> {
  /**
   * Find by placeholder code
   */
  findByPlaceholderCode(placeholderCode: string): Promise<PlaceholderMaster | null>;
}
