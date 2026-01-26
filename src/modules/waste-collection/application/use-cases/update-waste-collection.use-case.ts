import { Injectable, Inject } from '@nestjs/common';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { WasteCollection } from '../../domain/entities/waste-collection.domain.entity';
import { UpdateWasteCollectionDto } from '../dto/update-waste-collection.dto';
import { WasteCollectionNotFoundException, WasteCollectionReadOnlyException } from '../../domain/exceptions/waste-collection.exceptions';
import { CollectionStatus } from '../../infrastructure/transaction/waste-collection.entity';

@Injectable()
export class UpdateWasteCollectionUseCase {
  constructor(
    @Inject(WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly wasteCollectionRepository: IWasteCollectionRepository,
  ) {}

  async execute(
    wasteCollectionId: string,
    updateWasteCollectionDto: UpdateWasteCollectionDto,
    modifiedBy?: string,
  ): Promise<WasteCollection> {
    const wasteCollection = await this.wasteCollectionRepository.findById(wasteCollectionId);
    if (!wasteCollection) {
      throw new WasteCollectionNotFoundException(wasteCollectionId);
    }

    // Check if collection can be edited
    if (!wasteCollection.canEdit()) {
      throw new WasteCollectionReadOnlyException(wasteCollection.status);
    }

    // If status is being changed to COLLECTED and weight is provided, mark as collected
    if (updateWasteCollectionDto.status === CollectionStatus.COLLECTED && updateWasteCollectionDto.weightKg) {
      wasteCollection.markAsCollected(
        updateWasteCollectionDto.collectedBy || modifiedBy || '',
        updateWasteCollectionDto.weightKg,
      );
    } else {
      wasteCollection.update({
        weightKg: updateWasteCollectionDto.weightKg,
        status: updateWasteCollectionDto.status,
        collectedBy: updateWasteCollectionDto.collectedBy,
        notes: updateWasteCollectionDto.notes,
        modifiedBy: modifiedBy || null,
      });
    }

    return this.wasteCollectionRepository.update(wasteCollectionId, wasteCollection);
  }
}
