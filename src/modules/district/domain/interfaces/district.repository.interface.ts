import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { District } from '../entities/district.domain.entity';

export const DISTRICT_REPOSITORY_TOKEN = 'DISTRICT_REPOSITORY';

export interface IDistrictRepository extends IBaseMasterRepository<District> {
  /**
   * Find by district code
   */
  findByDistrictCode(districtCode: string): Promise<District | null>;

  /**
   * Find by district name
   */
  findByDistrictName(districtName: string): Promise<District | null>;

  /**
   * Find all districts by state ID
   */
  findByStateId(stateId: string): Promise<District[]>;

  /**
   * Find all active districts by state ID
   */
  findActiveByStateId(stateId: string): Promise<District[]>;
}
