import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteProcessEntity } from './infrastructure/transaction/waste-process.entity';
import { WasteProcessController } from './presentation/waste-process.controller';
import { WasteProcessRepository } from './infrastructure/persistence/waste-process.repository';
import { WASTE_PROCESS_REPOSITORY_TOKEN } from './domain/interfaces/waste-process.repository.interface';
import { CreateWasteProcessUseCase } from './application/use-cases/create-waste-process.use-case';
import { GetWasteProcessUseCase } from './application/use-cases/get-waste-process.use-case';
import { GetAllWasteProcessesUseCase } from './application/use-cases/get-all-waste-processes.use-case';
import { UpdateWasteProcessUseCase } from './application/use-cases/update-waste-process.use-case';
import { SubmitWasteProcessUseCase } from './application/use-cases/submit-waste-process.use-case';
import { VerifyWasteProcessUseCase } from './application/use-cases/verify-waste-process.use-case';
import { CloseWasteProcessUseCase } from './application/use-cases/close-waste-process.use-case';
import { DeleteWasteProcessUseCase } from './application/use-cases/delete-waste-process.use-case';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WasteProcessEntity], 'transaction'),
    CompanyModule,
  ],
  controllers: [WasteProcessController],
  providers: [
    {
      provide: WASTE_PROCESS_REPOSITORY_TOKEN,
      useClass: WasteProcessRepository,
    },
    CreateWasteProcessUseCase,
    GetWasteProcessUseCase,
    GetAllWasteProcessesUseCase,
    UpdateWasteProcessUseCase,
    SubmitWasteProcessUseCase,
    VerifyWasteProcessUseCase,
    CloseWasteProcessUseCase,
    DeleteWasteProcessUseCase,
  ],
  exports: [],
})
export class WasteProcessModule {}
