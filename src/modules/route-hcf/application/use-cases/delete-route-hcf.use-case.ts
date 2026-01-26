import { Injectable, Inject } from '@nestjs/common';
import { IRouteHcfRepository, ROUTE_HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/route-hcf.repository.interface';
import { RouteHcfNotFoundException } from '../../domain/exceptions/route-hcf.exceptions';

@Injectable()
export class DeleteRouteHcfUseCase {
  constructor(
    @Inject(ROUTE_HCF_REPOSITORY_TOKEN)
    private readonly routeHcfRepository: IRouteHcfRepository,
  ) {}

  async execute(routeHcfId: string, modifiedBy?: string): Promise<void> {
    const routeHcf = await this.routeHcfRepository.findById(routeHcfId);
    if (!routeHcf) {
      throw new RouteHcfNotFoundException(routeHcfId);
    }

    routeHcf.softDelete(modifiedBy || null);
    await this.routeHcfRepository.softDelete(routeHcfId);
  }
}
