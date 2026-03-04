import { Injectable, Inject } from '@nestjs/common';
import { IDistrictRepository, DISTRICT_REPOSITORY_TOKEN } from '../../domain/interfaces/district.repository.interface';
import { District } from '../../domain/entities/district.domain.entity';
import { CreateDistrictDto } from '../dto/create-district.dto';
import {
  DuplicateDistrictCodeException,
  DuplicateDistrictNameException,
} from '../../domain/exceptions/district.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateDistrictUseCase {
  constructor(
    @Inject(DISTRICT_REPOSITORY_TOKEN)
    private readonly districtRepository: IDistrictRepository,
  ) {}

  async execute(createDistrictDto: CreateDistrictDto, createdBy?: string): Promise<District> {
    // Check for duplicate district code
    const existingByCode = await this.districtRepository.findByDistrictCode(createDistrictDto.districtCode);
    if (existingByCode) {
      throw new DuplicateDistrictCodeException(createDistrictDto.districtCode);
    }

    // Check for duplicate district name
    const existingByName = await this.districtRepository.findByDistrictName(createDistrictDto.districtName);
    if (existingByName) {
      throw new DuplicateDistrictNameException(createDistrictDto.districtName);
    }

    // Create domain entity
    const district = District.create({
      districtId: randomUUID(),
      districtCode: createDistrictDto.districtCode,
      districtName: createDistrictDto.districtName,
      stateId: createDistrictDto.stateId || null,
      createdBy: createdBy || null,
    });

    // Persist through repository
    return this.districtRepository.create(district);
  }
}
