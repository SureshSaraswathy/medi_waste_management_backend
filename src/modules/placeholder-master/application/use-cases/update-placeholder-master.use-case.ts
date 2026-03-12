import { Injectable, Inject } from '@nestjs/common';
import { IPlaceholderMasterRepository, PLACEHOLDER_MASTER_REPOSITORY_TOKEN } from '../../domain/interfaces/placeholder-master.repository.interface';
import { PlaceholderMaster } from '../../domain/entities/placeholder-master.domain.entity';
import { UpdatePlaceholderMasterDto } from '../dto/update-placeholder-master.dto';
import { PlaceholderMasterNotFoundException } from '../../domain/exceptions/placeholder-master.exceptions';

@Injectable()
export class UpdatePlaceholderMasterUseCase {
  constructor(
    @Inject(PLACEHOLDER_MASTER_REPOSITORY_TOKEN)
    private readonly placeholderRepository: IPlaceholderMasterRepository,
  ) {}

  async execute(placeholderId: string, updatePlaceholderDto: UpdatePlaceholderMasterDto, modifiedBy?: string): Promise<PlaceholderMaster> {
    const placeholder = await this.placeholderRepository.findById(placeholderId);
    if (!placeholder) {
      throw new PlaceholderMasterNotFoundException(placeholderId);
    }

    // Update placeholder
    placeholder.update({
      placeholderDescription: updatePlaceholderDto.placeholderDescription,
      sourceTable: updatePlaceholderDto.sourceTable,
      sourceColumn: updatePlaceholderDto.sourceColumn,
      status: updatePlaceholderDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist changes
    return this.placeholderRepository.update(placeholderId, placeholder);
  }
}
