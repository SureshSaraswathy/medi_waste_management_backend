import { Injectable, Inject } from '@nestjs/common';
import { IPcbZoneRepository, PCB_ZONE_REPOSITORY_TOKEN } from '../../domain/interfaces/pcb-zone.repository.interface';
import { PcbZone } from '../../domain/entities/pcb-zone.domain.entity';
import { PcbZoneNotFoundException } from '../../domain/exceptions/pcb-zone.exceptions';

@Injectable()
export class GetPcbZoneUseCase {
  constructor(
    @Inject(PCB_ZONE_REPOSITORY_TOKEN)
    private readonly pcbZoneRepository: IPcbZoneRepository,
  ) {}

  async execute(pcbZoneId: string): Promise<PcbZone> {
    const pcbZone = await this.pcbZoneRepository.findById(pcbZoneId);
    if (!pcbZone) {
      throw new PcbZoneNotFoundException(pcbZoneId);
    }
    return pcbZone;
  }
}
