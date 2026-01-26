import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Fleet } from '../entities/fleet.domain.entity';

export const FLEET_REPOSITORY_TOKEN = 'FLEET_REPOSITORY';

export interface IFleetRepository extends IBaseMasterRepository<Fleet> {
  findByVehicleNum(vehicleNum: string, companyId: string): Promise<Fleet | null>;
  findByCompany(companyId: string): Promise<Fleet[]>;
}
