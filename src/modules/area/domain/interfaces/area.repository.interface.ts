import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Area } from '../entities/area.domain.entity';

export const AREA_REPOSITORY_TOKEN = 'AREA_REPOSITORY';

export interface IAreaRepository extends IBaseMasterRepository<Area> {
  findByAreaCode(areaCode: string): Promise<Area | null>;
  findByAreaName(areaName: string): Promise<Area | null>;
}
