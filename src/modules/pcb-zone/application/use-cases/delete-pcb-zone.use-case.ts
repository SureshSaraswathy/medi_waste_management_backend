import { Injectable, Inject } from '@nestjs/common';
import { IPcbZoneRepository, PCB_ZONE_REPOSITORY_TOKEN } from '../../domain/interfaces/pcb-zone.repository.interface';
import { PcbZoneNotFoundException } from '../../domain/exceptions/pcb-zone.exceptions';

@Injectable()
export class DeletePcbZoneUseCase {
  constructor(
    @Inject(PCB_ZONE_REPOSITORY_TOKEN)
    private readonly pcbZoneRepository: IPcbZoneRepository,
  ) {}

  async execute(pcbZoneId: string, modifiedBy?: string): Promise<void> {
    const pcbZone = await this.pcbZoneRepository.findById(pcbZoneId);
    if (!pcbZone) {
      throw new PcbZoneNotFoundException(pcbZoneId);
    }

    pcbZone.softDelete(modifiedBy || null);
    await this.pcbZoneRepository.softDelete(pcbZoneId);
  }
}
