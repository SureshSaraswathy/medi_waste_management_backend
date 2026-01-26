import { Injectable, Inject } from '@nestjs/common';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../domain/interfaces/route.repository.interface';
import { Route } from '../../domain/entities/route.domain.entity';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { RouteNotFoundException } from '../../domain/exceptions/route.exceptions';

@Injectable()
export class UpdateRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(routeId: string, updateRouteDto: UpdateRouteDto, modifiedBy?: string): Promise<Route> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundException(routeId);
    }

    route.update({
      frequencyId: updateRouteDto.frequencyId,
      status: updateRouteDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.routeRepository.update(routeId, route);
  }
}
