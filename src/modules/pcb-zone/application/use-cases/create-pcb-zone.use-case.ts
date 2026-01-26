import { Injectable, Inject } from '@nestjs/common';
import { IPcbZoneRepository, PCB_ZONE_REPOSITORY_TOKEN } from '../../domain/interfaces/pcb-zone.repository.interface';
import { PcbZone } from '../../domain/entities/pcb-zone.domain.entity';
import { CreatePcbZoneDto } from '../dto/create-pcb-zone.dto';
import { DuplicatePcbZoneNameException } from '../../domain/exceptions/pcb-zone.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreatePcbZoneUseCase {
  constructor(
    @Inject(PCB_ZONE_REPOSITORY_TOKEN)
    private readonly pcbZoneRepository: IPcbZoneRepository,
  ) {}

  async execute(createPcbZoneDto: CreatePcbZoneDto, createdBy?: string): Promise<PcbZone> {
    const existing = await this.pcbZoneRepository.findByPcbZoneName(createPcbZoneDto.pcbZoneName);
    if (existing) {
      throw new DuplicatePcbZoneNameException(createPcbZoneDto.pcbZoneName);
    }

    const pcbZone = PcbZone.create({
      pcbZoneId: randomUUID(),
      pcbZoneName: createPcbZoneDto.pcbZoneName,
      pcbZoneAddress: createPcbZoneDto.pcbZoneAddress || '',
      contactNum: createPcbZoneDto.contactNum || '',
      contactEmail: createPcbZoneDto.contactEmail || '',
      alertEmail: createPcbZoneDto.alertEmail || '',
      createdBy: createdBy || null,
    });

    return this.pcbZoneRepository.create(pcbZone);
  }
}
