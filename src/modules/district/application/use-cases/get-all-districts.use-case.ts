import { Injectable, Inject } from '@nestjs/common';
import { IDistrictRepository, DISTRICT_REPOSITORY_TOKEN } from '../../domain/interfaces/district.repository.interface';
import { District } from '../../domain/entities/district.domain.entity';

@Injectable()
export class GetAllDistrictsUseCase {
  constructor(
    @Inject(DISTRICT_REPOSITORY_TOKEN)
    private readonly districtRepository: IDistrictRepository,
  ) {}

  async execute(activeOnly: boolean = false, stateId?: string): Promise<District[]> {
    if (stateId) {
      if (activeOnly) {
        return this.districtRepository.findActiveByStateId(stateId);
      }
      return this.districtRepository.findByStateId(stateId);
    }

    if (activeOnly) {
      return this.districtRepository.findAllActive();
    }
    return this.districtRepository.findAll();
  }
}
