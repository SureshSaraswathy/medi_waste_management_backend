import { Injectable, Inject } from '@nestjs/common';
import { IFrequencyRepository, FREQUENCY_REPOSITORY_TOKEN } from '../../domain/interfaces/frequency.repository.interface';
import { Frequency } from '../../domain/entities/frequency.domain.entity';
import { CreateFrequencyDto } from '../dto/create-frequency.dto';
import { DuplicateFrequencyCodeException, DuplicateFrequencyNameException } from '../../domain/exceptions/frequency.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateFrequencyUseCase {
  constructor(
    @Inject(FREQUENCY_REPOSITORY_TOKEN)
    private readonly frequencyRepository: IFrequencyRepository,
  ) {}

  async execute(createFrequencyDto: CreateFrequencyDto, createdBy?: string): Promise<Frequency> {
    const existingByCode = await this.frequencyRepository.findByFrequencyCode(
      createFrequencyDto.frequencyCode,
      createFrequencyDto.companyId,
    );
    if (existingByCode) {
      throw new DuplicateFrequencyCodeException(createFrequencyDto.frequencyCode);
    }

    const existingByName = await this.frequencyRepository.findByFrequencyName(
      createFrequencyDto.frequencyName,
      createFrequencyDto.companyId,
    );
    if (existingByName) {
      throw new DuplicateFrequencyNameException(createFrequencyDto.frequencyName);
    }

    const frequency = Frequency.create({
      frequencyId: randomUUID(),
      frequencyCode: createFrequencyDto.frequencyCode,
      frequencyName: createFrequencyDto.frequencyName,
      companyId: createFrequencyDto.companyId,
      createdBy: createdBy || null,
    });

    return this.frequencyRepository.create(frequency);
  }
}
