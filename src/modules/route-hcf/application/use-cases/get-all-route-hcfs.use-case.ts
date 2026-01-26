import { Injectable, Inject } from '@nestjs/common';
import { IRouteHcfRepository, ROUTE_HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/route-hcf.repository.interface';
import { RouteHcf } from '../../domain/entities/route-hcf.domain.entity';

@Injectable()
export class GetAllRouteHcfsUseCase {
  constructor(
    @Inject(ROUTE_HCF_REPOSITORY_TOKEN)
    private readonly routeHcfRepository: IRouteHcfRepository,
  ) {}

  async execute(
    routeId?: string,
    hcfId?: string,
    companyId?: string,
    activeOnly: boolean = false,
  ): Promise<RouteHcf[]> {
    if (routeId) {
      return this.routeHcfRepository.findByRoute(routeId);
    }
    if (hcfId) {
      return this.routeHcfRepository.findByHcf(hcfId);
    }
    if (companyId) {
      return this.routeHcfRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.routeHcfRepository.findAllActive();
    }
    return this.routeHcfRepository.findAll();
  }
}
