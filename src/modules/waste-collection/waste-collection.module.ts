import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteCollectionController } from './presentation/waste-collection.controller';
import { WasteCollectionRepository } from './infrastructure/persistence/waste-collection.repository';
import { WasteCollectionEntity } from './infrastructure/transaction/waste-collection.entity';
import { CreateWasteCollectionUseCase } from './application/use-cases/create-waste-collection.use-case';
import { GetWasteCollectionUseCase } from './application/use-cases/get-waste-collection.use-case';
import { GetAllWasteCollectionsUseCase } from './application/use-cases/get-all-waste-collections.use-case';
import { UpdateWasteCollectionUseCase } from './application/use-cases/update-waste-collection.use-case';
import { DeleteWasteCollectionUseCase } from './application/use-cases/delete-waste-collection.use-case';
import { LookupBarcodeUseCase } from './application/use-cases/lookup-barcode.use-case';
import { CollectWasteUseCase } from './application/use-cases/collect-waste.use-case';
import { WASTE_COLLECTION_REPOSITORY_TOKEN } from './domain/interfaces/waste-collection.repository.interface';
import { HcfModule } from '../hcf/hcf.module';
import { CompanyModule } from '../company/company.module';
import { BarcodeLabelModule } from '../barcode-label/barcode-label.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WasteCollectionEntity], 'transaction'),
    HcfModule,
    CompanyModule,
    BarcodeLabelModule,
  ],
  controllers: [WasteCollectionController],
  providers: [
    {
      provide: WASTE_COLLECTION_REPOSITORY_TOKEN,
      useClass: WasteCollectionRepository,
    },
    CreateWasteCollectionUseCase,
    GetWasteCollectionUseCase,
    GetAllWasteCollectionsUseCase,
    UpdateWasteCollectionUseCase,
    DeleteWasteCollectionUseCase,
    LookupBarcodeUseCase,
    CollectWasteUseCase,
  ],
  exports: [WASTE_COLLECTION_REPOSITORY_TOKEN],
})
export class WasteCollectionModule {}
