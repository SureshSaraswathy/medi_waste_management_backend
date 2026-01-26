import { Injectable, Inject } from '@nestjs/common';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { WasteCollection } from '../../domain/entities/waste-collection.domain.entity';
import { WasteCollectionNotFoundException } from '../../domain/exceptions/waste-collection.exceptions';

@Injectable()
export class GetWasteCollectionUseCase {
  constructor(
    @Inject(WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly wasteCollectionRepository: IWasteCollectionRepository,
  ) {}

  async execute(wasteCollectionId: string): Promise<WasteCollection> {
    const wasteCollection = await this.wasteCollectionRepository.findById(wasteCollectionId);
    if (!wasteCollection) {
      throw new WasteCollectionNotFoundException(wasteCollectionId);
    }
    return wasteCollection;
  }
}
