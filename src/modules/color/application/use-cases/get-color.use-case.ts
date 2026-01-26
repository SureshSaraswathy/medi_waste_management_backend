import { Injectable, Inject } from '@nestjs/common';
import { IColorRepository, COLOR_REPOSITORY_TOKEN } from '../../domain/interfaces/color.repository.interface';
import { Color } from '../../domain/entities/color.domain.entity';
import { ColorNotFoundException } from '../../domain/exceptions/color.exceptions';

@Injectable()
export class GetColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY_TOKEN)
    private readonly colorRepository: IColorRepository,
  ) {}

  async execute(colorId: string): Promise<Color> {
    const color = await this.colorRepository.findById(colorId);
    if (!color) {
      throw new ColorNotFoundException(colorId);
    }
    return color;
  }
}
