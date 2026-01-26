import { Injectable, Inject } from '@nestjs/common';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { WasteCollection } from '../../domain/entities/waste-collection.domain.entity';
import { WasteCollectionNotFoundException, WasteCollectionReadOnlyException } from '../../domain/exceptions/waste-collection.exceptions';
import { CollectionStatus } from '../../infrastructure/transaction/waste-collection.entity';

@Injectable()
export class CollectWasteUseCase {
  constructor(
    @Inject(WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly wasteCollectionRepository: IWasteCollectionRepository,
  ) {}

  async execute(
    wasteCollectionId: string,
    weightKg: number,
    collectedBy: string,
  ): Promise<WasteCollection> {
    const wasteCollection = await this.wasteCollectionRepository.findById(wasteCollectionId);
    if (!wasteCollection) {
      throw new WasteCollectionNotFoundException(wasteCollectionId);
    }

    // Check if collection can be edited
    if (!wasteCollection.canEdit()) {
      throw new WasteCollectionReadOnlyException(wasteCollection.status);
    }

    // Mark as collected with weight
    wasteCollection.markAsCollected(collectedBy, weightKg);

    return this.wasteCollectionRepository.update(wasteCollectionId, wasteCollection);
  }
}
