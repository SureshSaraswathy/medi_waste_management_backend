import { Injectable, Inject } from '@nestjs/common';
import { IRouteHcfRepository, ROUTE_HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/route-hcf.repository.interface';
import { RouteHcf } from '../../domain/entities/route-hcf.domain.entity';
import { RouteHcfNotFoundException } from '../../domain/exceptions/route-hcf.exceptions';

@Injectable()
export class GetRouteHcfUseCase {
  constructor(
    @Inject(ROUTE_HCF_REPOSITORY_TOKEN)
    private readonly routeHcfRepository: IRouteHcfRepository,
  ) {}

  async execute(routeHcfId: string): Promise<RouteHcf> {
    const routeHcf = await this.routeHcfRepository.findById(routeHcfId);
    if (!routeHcf) {
      throw new RouteHcfNotFoundException(routeHcfId);
    }
    return routeHcf;
  }
}
