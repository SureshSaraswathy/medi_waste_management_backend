import { Injectable, Inject } from '@nestjs/common';
import { IRouteHcfRepository, ROUTE_HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/route-hcf.repository.interface';
import { RouteHcf } from '../../domain/entities/route-hcf.domain.entity';
import { UpdateRouteHcfDto } from '../dto/update-route-hcf.dto';
import { RouteHcfNotFoundException } from '../../domain/exceptions/route-hcf.exceptions';

@Injectable()
export class UpdateRouteHcfUseCase {
  constructor(
    @Inject(ROUTE_HCF_REPOSITORY_TOKEN)
    private readonly routeHcfRepository: IRouteHcfRepository,
  ) {}

  async execute(routeHcfId: string, updateRouteHcfDto: UpdateRouteHcfDto, modifiedBy?: string): Promise<RouteHcf> {
    const routeHcf = await this.routeHcfRepository.findById(routeHcfId);
    if (!routeHcf) {
      throw new RouteHcfNotFoundException(routeHcfId);
    }

    routeHcf.update({
      sequenceOrder: updateRouteHcfDto.sequenceOrder,
      status: updateRouteHcfDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.routeHcfRepository.update(routeHcfId, routeHcf);
  }
}
