import { Injectable, Inject } from '@nestjs/common';
import { IColorRepository, COLOR_REPOSITORY_TOKEN } from '../../domain/interfaces/color.repository.interface';
import { Color } from '../../domain/entities/color.domain.entity';

@Injectable()
export class GetAllColorsUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY_TOKEN)
    private readonly colorRepository: IColorRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<Color[]> {
    if (companyId) {
      return this.colorRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.colorRepository.findAllActive();
    }
    return this.colorRepository.findAll();
  }
}
