import { Injectable, Inject } from '@nestjs/common';
import { IAreaRepository, AREA_REPOSITORY_TOKEN } from '../../domain/interfaces/area.repository.interface';
import { Area } from '../../domain/entities/area.domain.entity';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { AreaNotFoundException } from '../../domain/exceptions/area.exceptions';

@Injectable()
export class UpdateAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY_TOKEN)
    private readonly areaRepository: IAreaRepository,
  ) {}

  async execute(areaId: string, updateAreaDto: UpdateAreaDto, modifiedBy?: string): Promise<Area> {
    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      throw new AreaNotFoundException(areaId);
    }

    area.update({
      areaPincode: updateAreaDto.areaPincode,
      status: updateAreaDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.areaRepository.update(areaId, area);
  }
}
