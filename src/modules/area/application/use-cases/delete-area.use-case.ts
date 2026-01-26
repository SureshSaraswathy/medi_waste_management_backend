import { Injectable, Inject } from '@nestjs/common';
import { IAreaRepository, AREA_REPOSITORY_TOKEN } from '../../domain/interfaces/area.repository.interface';
import { AreaNotFoundException } from '../../domain/exceptions/area.exceptions';

@Injectable()
export class DeleteAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY_TOKEN)
    private readonly areaRepository: IAreaRepository,
  ) {}

  async execute(areaId: string, modifiedBy?: string): Promise<void> {
    const area = await this.areaRepository.findById(areaId);
    if (!area) {
      throw new AreaNotFoundException(areaId);
    }

    area.softDelete(modifiedBy || null);
    await this.areaRepository.softDelete(areaId);
  }
}
