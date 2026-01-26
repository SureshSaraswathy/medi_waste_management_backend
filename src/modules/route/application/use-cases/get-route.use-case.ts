import { Injectable, Inject } from '@nestjs/common';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../domain/interfaces/route.repository.interface';
import { Route } from '../../domain/entities/route.domain.entity';
import { RouteNotFoundException } from '../../domain/exceptions/route.exceptions';

@Injectable()
export class GetRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(routeId: string): Promise<Route> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundException(routeId);
    }
    return route;
  }
}
