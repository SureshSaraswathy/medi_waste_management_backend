import { Injectable, Inject } from '@nestjs/common';
import { IFrequencyRepository, FREQUENCY_REPOSITORY_TOKEN } from '../../domain/interfaces/frequency.repository.interface';
import { Frequency } from '../../domain/entities/frequency.domain.entity';
import { FrequencyNotFoundException } from '../../domain/exceptions/frequency.exceptions';

@Injectable()
export class GetFrequencyUseCase {
  constructor(
    @Inject(FREQUENCY_REPOSITORY_TOKEN)
    private readonly frequencyRepository: IFrequencyRepository,
  ) {}

  async execute(frequencyId: string): Promise<Frequency> {
    const frequency = await this.frequencyRepository.findById(frequencyId);
    if (!frequency) {
      throw new FrequencyNotFoundException(frequencyId);
    }
    return frequency;
  }
}
