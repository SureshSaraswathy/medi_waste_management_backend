import { Injectable, Inject } from '@nestjs/common';
import { IDistrictRepository, DISTRICT_REPOSITORY_TOKEN } from '../../domain/interfaces/district.repository.interface';
import { DistrictNotFoundException } from '../../domain/exceptions/district.exceptions';

@Injectable()
export class DeleteDistrictUseCase {
  constructor(
    @Inject(DISTRICT_REPOSITORY_TOKEN)
    private readonly districtRepository: IDistrictRepository,
  ) {}

  async execute(districtId: string, modifiedBy?: string): Promise<void> {
    const district = await this.districtRepository.findById(districtId);
    if (!district) {
      throw new DistrictNotFoundException(districtId);
    }

    await this.districtRepository.softDelete(districtId);
  }
}
