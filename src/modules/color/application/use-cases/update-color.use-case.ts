import { Injectable, Inject } from '@nestjs/common';
import { IColorRepository, COLOR_REPOSITORY_TOKEN } from '../../domain/interfaces/color.repository.interface';
import { Color } from '../../domain/entities/color.domain.entity';
import { UpdateColorDto } from '../dto/update-color.dto';
import { ColorNotFoundException } from '../../domain/exceptions/color.exceptions';

@Injectable()
export class UpdateColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY_TOKEN)
    private readonly colorRepository: IColorRepository,
  ) {}

  async execute(colorId: string, updateColorDto: UpdateColorDto, modifiedBy?: string): Promise<Color> {
    const color = await this.colorRepository.findById(colorId);
    if (!color) {
      throw new ColorNotFoundException(colorId);
    }

    color.update({
      status: updateColorDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.colorRepository.update(colorId, color);
  }
}
