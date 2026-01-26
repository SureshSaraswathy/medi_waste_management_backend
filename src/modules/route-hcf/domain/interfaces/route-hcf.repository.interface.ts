import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { RouteHcf } from '../entities/route-hcf.domain.entity';

export const ROUTE_HCF_REPOSITORY_TOKEN = 'ROUTE_HCF_REPOSITORY';

export interface IRouteHcfRepository extends IBaseMasterRepository<RouteHcf> {
  findByRouteAndHcf(routeId: string, hcfId: string): Promise<RouteHcf | null>;
  findByRoute(routeId: string): Promise<RouteHcf[]>;
  findByHcf(hcfId: string): Promise<RouteHcf[]>;
  findByCompany(companyId: string): Promise<RouteHcf[]>;
}
