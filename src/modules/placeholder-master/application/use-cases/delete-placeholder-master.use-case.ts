import { Injectable, Inject } from '@nestjs/common';
import { IPlaceholderMasterRepository, PLACEHOLDER_MASTER_REPOSITORY_TOKEN } from '../../domain/interfaces/placeholder-master.repository.interface';
import { PlaceholderMasterNotFoundException } from '../../domain/exceptions/placeholder-master.exceptions';

@Injectable()
export class DeletePlaceholderMasterUseCase {
  constructor(
    @Inject(PLACEHOLDER_MASTER_REPOSITORY_TOKEN)
    private readonly placeholderRepository: IPlaceholderMasterRepository,
  ) {}

  async execute(placeholderId: string, modifiedBy?: string): Promise<void> {
    const placeholder = await this.placeholderRepository.findById(placeholderId);
    if (!placeholder) {
      throw new PlaceholderMasterNotFoundException(placeholderId);
    }

    await this.placeholderRepository.softDelete(placeholderId);
  }
}
