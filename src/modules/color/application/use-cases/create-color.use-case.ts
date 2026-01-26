import { Injectable, Inject } from '@nestjs/common';
import { IColorRepository, COLOR_REPOSITORY_TOKEN } from '../../domain/interfaces/color.repository.interface';
import { Color } from '../../domain/entities/color.domain.entity';
import { CreateColorDto } from '../dto/create-color.dto';
import { DuplicateColorNameException } from '../../domain/exceptions/color.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateColorUseCase {
  constructor(
    @Inject(COLOR_REPOSITORY_TOKEN)
    private readonly colorRepository: IColorRepository,
  ) {}

  async execute(createColorDto: CreateColorDto, createdBy?: string): Promise<Color> {
    const existing = await this.colorRepository.findByColorNameAndCompany(
      createColorDto.colorName,
      createColorDto.companyId,
    );
    if (existing) {
      throw new DuplicateColorNameException(createColorDto.colorName, createColorDto.companyId);
    }

    const color = Color.create({
      colorId: randomUUID(),
      colorName: createColorDto.colorName,
      companyId: createColorDto.companyId,
      createdBy: createdBy || null,
    });

    return this.colorRepository.create(color);
  }
}
