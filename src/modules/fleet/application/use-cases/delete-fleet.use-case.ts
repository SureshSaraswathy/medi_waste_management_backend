import { Injectable, Inject } from '@nestjs/common';
import { IFleetRepository, FLEET_REPOSITORY_TOKEN } from '../../domain/interfaces/fleet.repository.interface';
import { FleetNotFoundException } from '../../domain/exceptions/fleet.exceptions';

@Injectable()
export class DeleteFleetUseCase {
  constructor(
    @Inject(FLEET_REPOSITORY_TOKEN)
    private readonly fleetRepository: IFleetRepository,
  ) {}

  async execute(fleetId: string, modifiedBy?: string): Promise<void> {
    const fleet = await this.fleetRepository.findById(fleetId);
    if (!fleet) {
      throw new FleetNotFoundException(fleetId);
    }

    fleet.softDelete(modifiedBy || null);
    await this.fleetRepository.softDelete(fleetId);
  }
}
