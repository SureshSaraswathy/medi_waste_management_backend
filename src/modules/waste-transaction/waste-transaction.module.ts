import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteTransactionController } from './presentation/waste-transaction.controller';
import { WasteTransactionRepository } from './infrastructure/persistence/waste-transaction.repository';
import { WasteTransactionEntity } from './infrastructure/transaction/waste-transaction.entity';
import { CreateWasteTransactionUseCase } from './application/use-cases/create-waste-transaction.use-case';
import { GetWasteTransactionUseCase } from './application/use-cases/get-waste-transaction.use-case';
import { GetAllWasteTransactionsUseCase } from './application/use-cases/get-all-waste-transactions.use-case';
import { UpdateWasteTransactionUseCase } from './application/use-cases/update-waste-transaction.use-case';
import { SubmitWasteTransactionUseCase } from './application/use-cases/submit-waste-transaction.use-case';
import { VerifyWasteTransactionUseCase } from './application/use-cases/verify-waste-transaction.use-case';
import { DeleteWasteTransactionUseCase } from './application/use-cases/delete-waste-transaction.use-case';
import { WASTE_TRANSACTION_REPOSITORY_TOKEN } from './domain/interfaces/waste-transaction.repository.interface';
import { HcfModule } from '../hcf/hcf.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WasteTransactionEntity], 'transaction'),
    HcfModule,
    CompanyModule,
  ],
  controllers: [WasteTransactionController],
  providers: [
    {
      provide: WASTE_TRANSACTION_REPOSITORY_TOKEN,
      useClass: WasteTransactionRepository,
    },
    CreateWasteTransactionUseCase,
    GetWasteTransactionUseCase,
    GetAllWasteTransactionsUseCase,
    UpdateWasteTransactionUseCase,
    SubmitWasteTransactionUseCase,
    VerifyWasteTransactionUseCase,
    DeleteWasteTransactionUseCase,
  ],
  exports: [WASTE_TRANSACTION_REPOSITORY_TOKEN],
})
export class WasteTransactionModule {}
