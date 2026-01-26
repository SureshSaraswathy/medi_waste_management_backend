import { Injectable, Inject } from '@nestjs/common';
import { IFrequencyRepository, FREQUENCY_REPOSITORY_TOKEN } from '../../domain/interfaces/frequency.repository.interface';
import { FrequencyNotFoundException } from '../../domain/exceptions/frequency.exceptions';

@Injectable()
export class DeleteFrequencyUseCase {
  constructor(
    @Inject(FREQUENCY_REPOSITORY_TOKEN)
    private readonly frequencyRepository: IFrequencyRepository,
  ) {}

  async execute(frequencyId: string, modifiedBy?: string): Promise<void> {
    const frequency = await this.frequencyRepository.findById(frequencyId);
    if (!frequency) {
      throw new FrequencyNotFoundException(frequencyId);
    }

    frequency.softDelete(modifiedBy || null);
    await this.frequencyRepository.softDelete(frequencyId);
  }
}
