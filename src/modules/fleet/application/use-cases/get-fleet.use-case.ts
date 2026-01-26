import { Injectable, Inject } from '@nestjs/common';
import { IFleetRepository, FLEET_REPOSITORY_TOKEN } from '../../domain/interfaces/fleet.repository.interface';
import { Fleet } from '../../domain/entities/fleet.domain.entity';
import { FleetNotFoundException } from '../../domain/exceptions/fleet.exceptions';

@Injectable()
export class GetFleetUseCase {
  constructor(
    @Inject(FLEET_REPOSITORY_TOKEN)
    private readonly fleetRepository: IFleetRepository,
  ) {}

  async execute(fleetId: string): Promise<Fleet> {
    const fleet = await this.fleetRepository.findById(fleetId);
    if (!fleet) {
      throw new FleetNotFoundException(fleetId);
    }
    return fleet;
  }
}
