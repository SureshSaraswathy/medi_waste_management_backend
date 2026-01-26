import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { State } from '../entities/state.domain.entity';

export const STATE_REPOSITORY_TOKEN = 'STATE_REPOSITORY';

export interface IStateRepository extends IBaseMasterRepository<State> {
  /**
   * Find by state code
   */
  findByStateCode(stateCode: string): Promise<State | null>;

  /**
   * Find by state name
   */
  findByStateName(stateName: string): Promise<State | null>;
}
