import { Injectable, Inject } from '@nestjs/common';
import { IPlaceholderMasterRepository, PLACEHOLDER_MASTER_REPOSITORY_TOKEN } from '../../domain/interfaces/placeholder-master.repository.interface';
import { PlaceholderMaster } from '../../domain/entities/placeholder-master.domain.entity';
import { CreatePlaceholderMasterDto } from '../dto/create-placeholder-master.dto';
import {
  DuplicatePlaceholderCodeException,
} from '../../domain/exceptions/placeholder-master.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreatePlaceholderMasterUseCase {
  constructor(
    @Inject(PLACEHOLDER_MASTER_REPOSITORY_TOKEN)
    private readonly placeholderRepository: IPlaceholderMasterRepository,
  ) {}

  async execute(createPlaceholderDto: CreatePlaceholderMasterDto, createdBy?: string): Promise<PlaceholderMaster> {
    // Check for duplicate placeholder code
    const existingByCode = await this.placeholderRepository.findByPlaceholderCode(createPlaceholderDto.placeholderCode);
    if (existingByCode) {
      throw new DuplicatePlaceholderCodeException(createPlaceholderDto.placeholderCode);
    }

    // Create domain entity
    const placeholder = PlaceholderMaster.create({
      placeholderId: randomUUID(),
      placeholderCode: createPlaceholderDto.placeholderCode,
      placeholderDescription: createPlaceholderDto.placeholderDescription,
      sourceTable: createPlaceholderDto.sourceTable,
      sourceColumn: createPlaceholderDto.sourceColumn,
      createdBy: createdBy || null,
    });

    // Persist through repository
    return this.placeholderRepository.create(placeholder);
  }
}
