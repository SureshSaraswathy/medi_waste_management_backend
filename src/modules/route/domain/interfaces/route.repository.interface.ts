import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Route } from '../entities/route.domain.entity';

export const ROUTE_REPOSITORY_TOKEN = 'ROUTE_REPOSITORY';

export interface IRouteRepository extends IBaseMasterRepository<Route> {
  findByRouteCode(routeCode: string, companyId: string): Promise<Route | null>;
  findByRouteName(routeName: string, companyId: string): Promise<Route | null>;
  findByCompany(companyId: string): Promise<Route[]>;
}
