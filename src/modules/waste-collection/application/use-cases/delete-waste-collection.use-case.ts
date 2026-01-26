import { Injectable, Inject } from '@nestjs/common';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { WasteCollectionNotFoundException, WasteCollectionReadOnlyException } from '../../domain/exceptions/waste-collection.exceptions';

@Injectable()
export class DeleteWasteCollectionUseCase {
  constructor(
    @Inject(WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly wasteCollectionRepository: IWasteCollectionRepository,
  ) {}

  async execute(wasteCollectionId: string, modifiedBy?: string): Promise<void> {
    const wasteCollection = await this.wasteCollectionRepository.findById(wasteCollectionId);
    if (!wasteCollection) {
      throw new WasteCollectionNotFoundException(wasteCollectionId);
    }

    // Only allow deletion of Pending and Collected collections
    if (!wasteCollection.canEdit()) {
      throw new WasteCollectionReadOnlyException(wasteCollection.status);
    }

    await this.wasteCollectionRepository.softDelete(wasteCollectionId);
  }
}
