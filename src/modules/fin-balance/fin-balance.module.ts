import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinBalanceEntity } from './infrastructure/transaction/fin-balance.entity';
import { FinBalanceRepository } from './infrastructure/persistence/fin-balance.repository';
import { FinBalanceController } from './presentation/fin-balance.controller';
import { CreateFinBalanceUseCase } from './application/use-cases/create-fin-balance.use-case';
import { UpdateFinBalanceUseCase } from './application/use-cases/update-fin-balance.use-case';
import { BulkUploadFinBalanceUseCase } from './application/use-cases/bulk-upload-fin-balance.use-case';
import { ExcelParserService } from './application/services/excel-parser.service';
import {
  FIN_BALANCE_REPOSITORY_TOKEN,
} from './domain/interfaces/fin-balance.repository.interface';
import { CompanyModule } from '../company/company.module';
import { HcfModule } from '../hcf/hcf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinBalanceEntity], 'transaction'),
    CompanyModule,
    HcfModule,
  ],
  controllers: [FinBalanceController],
  providers: [
    {
      provide: FIN_BALANCE_REPOSITORY_TOKEN,
      useClass: FinBalanceRepository,
    },
    CreateFinBalanceUseCase,
    UpdateFinBalanceUseCase,
    BulkUploadFinBalanceUseCase,
    ExcelParserService,
  ],
  exports: [
    FIN_BALANCE_REPOSITORY_TOKEN,
  ],
})
export class FinBalanceModule {}
