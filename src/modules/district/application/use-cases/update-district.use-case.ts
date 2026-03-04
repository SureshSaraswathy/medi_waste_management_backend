import { Injectable, Inject } from '@nestjs/common';
import { IDistrictRepository, DISTRICT_REPOSITORY_TOKEN } from '../../domain/interfaces/district.repository.interface';
import { District } from '../../domain/entities/district.domain.entity';
import { UpdateDistrictDto } from '../dto/update-district.dto';
import { DistrictNotFoundException } from '../../domain/exceptions/district.exceptions';

@Injectable()
export class UpdateDistrictUseCase {
  constructor(
    @Inject(DISTRICT_REPOSITORY_TOKEN)
    private readonly districtRepository: IDistrictRepository,
  ) {}

  async execute(districtId: string, updateDistrictDto: UpdateDistrictDto, modifiedBy?: string): Promise<District> {
    const district = await this.districtRepository.findById(districtId);
    if (!district) {
      throw new DistrictNotFoundException(districtId);
    }

    // Update district
    district.update({
      stateId: updateDistrictDto.stateId,
      status: updateDistrictDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist changes
    return this.districtRepository.update(districtId, district);
  }
}
