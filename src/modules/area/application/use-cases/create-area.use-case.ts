import { Injectable, Inject } from '@nestjs/common';
import { IAreaRepository, AREA_REPOSITORY_TOKEN } from '../../domain/interfaces/area.repository.interface';
import { Area } from '../../domain/entities/area.domain.entity';
import { CreateAreaDto } from '../dto/create-area.dto';
import {
  DuplicateAreaCodeException,
  DuplicateAreaNameException,
} from '../../domain/exceptions/area.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY_TOKEN)
    private readonly areaRepository: IAreaRepository,
  ) {}

  async execute(createAreaDto: CreateAreaDto, createdBy?: string): Promise<Area> {
    const existingByCode = await this.areaRepository.findByAreaCode(createAreaDto.areaCode);
    if (existingByCode) {
      throw new DuplicateAreaCodeException(createAreaDto.areaCode);
    }

    const existingByName = await this.areaRepository.findByAreaName(createAreaDto.areaName);
    if (existingByName) {
      throw new DuplicateAreaNameException(createAreaDto.areaName);
    }

    const area = Area.create({
      areaId: randomUUID(),
      areaCode: createAreaDto.areaCode,
      areaName: createAreaDto.areaName,
      areaPincode: createAreaDto.areaPincode,
      createdBy: createdBy || null,
    });

    return this.areaRepository.create(area);
  }
}
