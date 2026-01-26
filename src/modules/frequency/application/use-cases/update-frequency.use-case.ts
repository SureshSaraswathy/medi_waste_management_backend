import { Injectable, Inject } from '@nestjs/common';
import { IFrequencyRepository, FREQUENCY_REPOSITORY_TOKEN } from '../../domain/interfaces/frequency.repository.interface';
import { Frequency } from '../../domain/entities/frequency.domain.entity';
import { UpdateFrequencyDto } from '../dto/update-frequency.dto';
import { FrequencyNotFoundException } from '../../domain/exceptions/frequency.exceptions';

@Injectable()
export class UpdateFrequencyUseCase {
  constructor(
    @Inject(FREQUENCY_REPOSITORY_TOKEN)
    private readonly frequencyRepository: IFrequencyRepository,
  ) {}

  async execute(frequencyId: string, updateFrequencyDto: UpdateFrequencyDto, modifiedBy?: string): Promise<Frequency> {
    const frequency = await this.frequencyRepository.findById(frequencyId);
    if (!frequency) {
      throw new FrequencyNotFoundException(frequencyId);
    }

    frequency.update({
      status: updateFrequencyDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.frequencyRepository.update(frequencyId, frequency);
  }
}
