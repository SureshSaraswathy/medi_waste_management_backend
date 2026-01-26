import { Injectable, Inject } from '@nestjs/common';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../domain/interfaces/route.repository.interface';
import { RouteNotFoundException } from '../../domain/exceptions/route.exceptions';

@Injectable()
export class DeleteRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(routeId: string, modifiedBy?: string): Promise<void> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundException(routeId);
    }

    route.softDelete(modifiedBy || null);
    await this.routeRepository.softDelete(routeId);
  }
}
