import { Injectable, Inject } from '@nestjs/common';
import { IDistrictRepository, DISTRICT_REPOSITORY_TOKEN } from '../../domain/interfaces/district.repository.interface';
import { District } from '../../domain/entities/district.domain.entity';
import { DistrictNotFoundException } from '../../domain/exceptions/district.exceptions';

@Injectable()
export class GetDistrictUseCase {
  constructor(
    @Inject(DISTRICT_REPOSITORY_TOKEN)
    private readonly districtRepository: IDistrictRepository,
  ) {}

  async execute(districtId: string): Promise<District> {
    const district = await this.districtRepository.findById(districtId);
    if (!district) {
      throw new DistrictNotFoundException(districtId);
    }
    return district;
  }
}
