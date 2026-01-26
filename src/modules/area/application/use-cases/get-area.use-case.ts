import { Injectable, Inject } from '@nestjs/common';
import { IAreaRepository, AREA_REPOSITORY_TOKEN } from '../../domain/interfaces/area.repository.interface';
import { Area } from '../../domain/entities/area.domain.entity';
import { AreaNotFoundException } from '../../domain/exceptions/area.exceptions';

@Injectable()
export class GetAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY_TOKEN)
    private readonly areaRepository: IAreaRepository,
  ) {}

  async execute(areaId: string): Promise<Area> {
    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      throw new AreaNotFoundException(areaId);
    }
    return area;
  }
}
