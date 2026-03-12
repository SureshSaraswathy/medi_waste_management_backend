import { Injectable, Inject } from '@nestjs/common';
import { IPlaceholderMasterRepository, PLACEHOLDER_MASTER_REPOSITORY_TOKEN } from '../../domain/interfaces/placeholder-master.repository.interface';
import { PlaceholderMaster } from '../../domain/entities/placeholder-master.domain.entity';
import { PlaceholderMasterNotFoundException } from '../../domain/exceptions/placeholder-master.exceptions';

@Injectable()
export class GetPlaceholderMasterUseCase {
  constructor(
    @Inject(PLACEHOLDER_MASTER_REPOSITORY_TOKEN)
    private readonly placeholderRepository: IPlaceholderMasterRepository,
  ) {}

  async execute(placeholderId: string): Promise<PlaceholderMaster> {
    const placeholder = await this.placeholderRepository.findById(placeholderId);
    if (!placeholder) {
      throw new PlaceholderMasterNotFoundException(placeholderId);
    }
    return placeholder;
  }
}
