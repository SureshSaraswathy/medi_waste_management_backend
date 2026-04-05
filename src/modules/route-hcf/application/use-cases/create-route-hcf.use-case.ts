import { Injectable, Inject } from '@nestjs/common';
import { IRouteHcfRepository, ROUTE_HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/route-hcf.repository.interface';
import { RouteHcf } from '../../domain/entities/route-hcf.domain.entity';
import { CreateRouteHcfDto } from '../dto/create-route-hcf.dto';
import {
  DuplicateRouteHcfMappingException,
  HcfAlreadyMappedToAnotherRouteException,
} from '../../domain/exceptions/route-hcf.exceptions';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateRouteHcfUseCase {
  constructor(
    @Inject(ROUTE_HCF_REPOSITORY_TOKEN)
    private readonly routeHcfRepository: IRouteHcfRepository,
  ) {}

  async execute(createRouteHcfDto: CreateRouteHcfDto, createdBy?: string): Promise<RouteHcf> {
    const existing = await this.routeHcfRepository.findByRouteAndHcf(
      createRouteHcfDto.routeId,
      createRouteHcfDto.hcfId,
    );
    if (existing) {
      throw new DuplicateRouteHcfMappingException(
        createRouteHcfDto.routeId,
        createRouteHcfDto.hcfId,
      );
    }

    const mappingsForHcf = await this.routeHcfRepository.findByHcf(createRouteHcfDto.hcfId);
    const activeOnAnyRoute = mappingsForHcf.find((m) => m.status === MasterStatus.ACTIVE);
    if (activeOnAnyRoute) {
      throw new HcfAlreadyMappedToAnotherRouteException();
    }

    const routeHcf = RouteHcf.create({
      routeHcfId: randomUUID(),
      routeId: createRouteHcfDto.routeId,
      hcfId: createRouteHcfDto.hcfId,
      companyId: createRouteHcfDto.companyId,
      sequenceOrder: createRouteHcfDto.sequenceOrder,
      createdBy: createdBy || null,
    });

    return this.routeHcfRepository.create(routeHcf);
  }
}
