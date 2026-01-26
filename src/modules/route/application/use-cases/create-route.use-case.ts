import { Injectable, Inject } from '@nestjs/common';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../domain/interfaces/route.repository.interface';
import { Route } from '../../domain/entities/route.domain.entity';
import { CreateRouteDto } from '../dto/create-route.dto';
import { DuplicateRouteCodeException, DuplicateRouteNameException } from '../../domain/exceptions/route.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(createRouteDto: CreateRouteDto, createdBy?: string): Promise<Route> {
    const existingByCode = await this.routeRepository.findByRouteCode(
      createRouteDto.routeCode,
      createRouteDto.companyId,
    );
    if (existingByCode) {
      throw new DuplicateRouteCodeException(createRouteDto.routeCode);
    }

    const existingByName = await this.routeRepository.findByRouteName(
      createRouteDto.routeName,
      createRouteDto.companyId,
    );
    if (existingByName) {
      throw new DuplicateRouteNameException(createRouteDto.routeName);
    }

    const route = Route.create({
      routeId: randomUUID(),
      routeCode: createRouteDto.routeCode,
      routeName: createRouteDto.routeName,
      companyId: createRouteDto.companyId,
      frequencyId: createRouteDto.frequencyId,
      createdBy: createdBy || null,
    });

    return this.routeRepository.create(route);
  }
}
