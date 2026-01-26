import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarcodeLabelController } from './presentation/barcode-label.controller';
import { BarcodeLabelRepository } from './infrastructure/persistence/barcode-label.repository';
import { BarcodeLabelEntity } from './infrastructure/transaction/barcode-label.entity';
import { GenerateBarcodeLabelsUseCase } from './application/use-cases/generate-barcode-labels.use-case';
import { GetBarcodeLabelUseCase } from './application/use-cases/get-barcode-label.use-case';
import { GetAllBarcodeLabelsUseCase } from './application/use-cases/get-all-barcode-labels.use-case';
import { GetLastSequenceUseCase } from './application/use-cases/get-last-sequence.use-case';
import { DeleteBarcodeLabelUseCase } from './application/use-cases/delete-barcode-label.use-case';
import { BARCODE_LABEL_REPOSITORY_TOKEN } from './domain/interfaces/barcode-label.repository.interface';
import { HcfModule } from '../hcf/hcf.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BarcodeLabelEntity], 'transaction'),
    HcfModule,
    CompanyModule,
  ],
  controllers: [BarcodeLabelController],
  providers: [
    {
      provide: BARCODE_LABEL_REPOSITORY_TOKEN,
      useClass: BarcodeLabelRepository,
    },
    GenerateBarcodeLabelsUseCase,
    GetBarcodeLabelUseCase,
    GetAllBarcodeLabelsUseCase,
    GetLastSequenceUseCase,
    DeleteBarcodeLabelUseCase,
  ],
  exports: [BARCODE_LABEL_REPOSITORY_TOKEN],
})
export class BarcodeLabelModule {}
