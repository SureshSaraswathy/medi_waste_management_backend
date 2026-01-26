import { Injectable, Inject } from '@nestjs/common';
import { IColorRepository, COLOR_REPOSITORY_TOKEN } from '../../domain/interfaces/color.repository.interface';
import { ColorNotFoundException } from '../../domain/exceptions/color.exceptions';

@Injectable()
export class DeleteColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY_TOKEN)
    private readonly colorRepository: IColorRepository,
  ) {}

  async execute(colorId: string, modifiedBy?: string): Promise<void> {
    const color = await this.colorRepository.findById(colorId);
    if (!color) {
      throw new ColorNotFoundException(colorId);
    }

    color.softDelete(modifiedBy || null);
    await this.colorRepository.softDelete(colorId);
  }
}
