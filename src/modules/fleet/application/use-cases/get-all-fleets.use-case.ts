import { Injectable, Inject } from '@nestjs/common';
import { IFleetRepository, FLEET_REPOSITORY_TOKEN } from '../../domain/interfaces/fleet.repository.interface';
import { Fleet } from '../../domain/entities/fleet.domain.entity';

@Injectable()
export class GetAllFleetsUseCase {
  constructor(
    @Inject(FLEET_REPOSITORY_TOKEN)
    private readonly fleetRepository: IFleetRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<Fleet[]> {
    if (companyId) {
      return this.fleetRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.fleetRepository.findAllActive();
    }
    return this.fleetRepository.findAll();
  }
}
