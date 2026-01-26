import { Injectable, Inject } from '@nestjs/common';
import { IAreaRepository, AREA_REPOSITORY_TOKEN } from '../../domain/interfaces/area.repository.interface';
import { Area } from '../../domain/entities/area.domain.entity';

@Injectable()
export class GetAllAreasUseCase {
  constructor(
    @Inject(AREA_REPOSITORY_TOKEN)
    private readonly areaRepository: IAreaRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<Area[]> {
    if (activeOnly) {
      return this.areaRepository.findAllActive();
    }
    return this.areaRepository.findAll();
  }
}
