import { Injectable, Inject } from '@nestjs/common';
import { IPcbZoneRepository, PCB_ZONE_REPOSITORY_TOKEN } from '../../domain/interfaces/pcb-zone.repository.interface';
import { PcbZone } from '../../domain/entities/pcb-zone.domain.entity';

@Injectable()
export class GetAllPcbZonesUseCase {
  constructor(
    @Inject(PCB_ZONE_REPOSITORY_TOKEN)
    private readonly pcbZoneRepository: IPcbZoneRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<PcbZone[]> {
    if (activeOnly) {
      return this.pcbZoneRepository.findAllActive();
    }
    return this.pcbZoneRepository.findAll();
  }
}
