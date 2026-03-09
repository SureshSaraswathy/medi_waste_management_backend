import { Injectable, Inject } from '@nestjs/common';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../../barcode-label/domain/interfaces/barcode-label.repository.interface';
import { WasteCollection } from '../../domain/entities/waste-collection.domain.entity';
import { CreateWasteCollectionDto } from '../dto/create-waste-collection.dto';
import { DuplicateCollectionException } from '../../domain/exceptions/waste-collection.exceptions';
import { CollectionStatus } from '../../infrastructure/transaction/waste-collection.entity';
import { BarcodeStatus } from '../../../barcode-label/infrastructure/transaction/barcode-label.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateWasteCollectionUseCase {
  constructor(
    @Inject(WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly wasteCollectionRepository: IWasteCollectionRepository,
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(createWasteCollectionDto: CreateWasteCollectionDto, createdBy?: string): Promise<WasteCollection> {
    const collectionDate = new Date(createWasteCollectionDto.collectionDate);

    // Check for duplicate collection (same barcode on same date)
    const existingCollection = await this.wasteCollectionRepository.findByBarcodeAndDate(
      createWasteCollectionDto.barcode,
      collectionDate,
    );
    if (existingCollection) {
      throw new DuplicateCollectionException(
        createWasteCollectionDto.barcode,
        createWasteCollectionDto.collectionDate,
      );
    }

    // Update barcode status to Collected when waste collection is created
    const barcodeLabel = await this.barcodeLabelRepository.findByBarcodeValue(createWasteCollectionDto.barcode);
    if (barcodeLabel && barcodeLabel.status === BarcodeStatus.ACTIVE) {
      barcodeLabel.updateStatus(BarcodeStatus.COLLECTED, createdBy || null);
      await this.barcodeLabelRepository.update(barcodeLabel);
    }

    const wasteCollection = WasteCollection.create({
      wasteCollectionId: randomUUID(),
      barcode: createWasteCollectionDto.barcode,
      collectionDate,
      companyId: createWasteCollectionDto.companyId,
      hcfId: createWasteCollectionDto.hcfId,
      wasteColor: createWasteCollectionDto.wasteColor,
      weightKg: createWasteCollectionDto.weightKg,
      status: createWasteCollectionDto.status || CollectionStatus.PENDING,
      routeAssignmentId: createWasteCollectionDto.routeAssignmentId,
      collectedBy: createWasteCollectionDto.collectedBy,
      notes: createWasteCollectionDto.notes,
      createdBy: createdBy || null,
    });

    return this.wasteCollectionRepository.create(wasteCollection);
  }
}
