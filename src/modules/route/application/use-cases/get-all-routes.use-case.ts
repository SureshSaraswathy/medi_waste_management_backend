import { Injectable, Inject } from '@nestjs/common';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../domain/interfaces/route.repository.interface';
import { Route } from '../../domain/entities/route.domain.entity';

@Injectable()
export class GetAllRoutesUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<Route[]> {
    if (companyId) {
      return this.routeRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.routeRepository.findAllActive();
    }
    return this.routeRepository.findAll();
  }
}
