import { Injectable, Inject } from '@nestjs/common';
import { IPcbZoneRepository, PCB_ZONE_REPOSITORY_TOKEN } from '../../domain/interfaces/pcb-zone.repository.interface';
import { PcbZone } from '../../domain/entities/pcb-zone.domain.entity';
import { UpdatePcbZoneDto } from '../dto/update-pcb-zone.dto';
import { PcbZoneNotFoundException } from '../../domain/exceptions/pcb-zone.exceptions';

@Injectable()
export class UpdatePcbZoneUseCase {
  constructor(
    @Inject(PCB_ZONE_REPOSITORY_TOKEN)
    private readonly pcbZoneRepository: IPcbZoneRepository,
  ) {}

  async execute(pcbZoneId: string, updatePcbZoneDto: UpdatePcbZoneDto, modifiedBy?: string): Promise<PcbZone> {
    const pcbZone = await this.pcbZoneRepository.findById(pcbZoneId);
    if (!pcbZone) {
      throw new PcbZoneNotFoundException(pcbZoneId);
    }

    pcbZone.update({
      pcbZoneAddress: updatePcbZoneDto.pcbZoneAddress,
      contactNum: updatePcbZoneDto.contactNum,
      contactEmail: updatePcbZoneDto.contactEmail,
      alertEmail: updatePcbZoneDto.alertEmail,
      status: updatePcbZoneDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.pcbZoneRepository.update(pcbZoneId, pcbZone);
  }
}
