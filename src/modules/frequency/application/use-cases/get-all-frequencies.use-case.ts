import { Injectable, Inject } from '@nestjs/common';
import { IFrequencyRepository, FREQUENCY_REPOSITORY_TOKEN } from '../../domain/interfaces/frequency.repository.interface';
import { Frequency } from '../../domain/entities/frequency.domain.entity';

@Injectable()
export class GetAllFrequenciesUseCase {
  constructor(
    @Inject(FREQUENCY_REPOSITORY_TOKEN)
    private readonly frequencyRepository: IFrequencyRepository,
  ) {}

  async execute(companyId?: string, activeOnly: boolean = false): Promise<Frequency[]> {
    if (companyId) {
      return this.frequencyRepository.findByCompany(companyId);
    }
    if (activeOnly) {
      return this.frequencyRepository.findAllActive();
    }
    return this.frequencyRepository.findAll();
  }
}
