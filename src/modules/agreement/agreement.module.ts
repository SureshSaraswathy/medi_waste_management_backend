import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgreementEntity } from './infrastructure/transaction/agreement.entity';
import { AgreementController } from './presentation/agreement.controller';
import { AgreementRepository } from './infrastructure/persistence/agreement.repository';
import { CreateAgreementUseCase } from './application/use-cases/create-agreement.use-case';
import { GetAgreementUseCase } from './application/use-cases/get-agreement.use-case';
import { GetAllAgreementsUseCase } from './application/use-cases/get-all-agreements.use-case';
import { UpdateAgreementUseCase } from './application/use-cases/update-agreement.use-case';
import { DeleteAgreementUseCase } from './application/use-cases/delete-agreement.use-case';
import { AGREEMENT_REPOSITORY_TOKEN } from './domain/interfaces/agreement.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgreementEntity], 'transaction'),
  ],
  controllers: [AgreementController],
  providers: [
    {
      provide: AGREEMENT_REPOSITORY_TOKEN,
      useClass: AgreementRepository,
    },
    CreateAgreementUseCase,
    GetAgreementUseCase,
    GetAllAgreementsUseCase,
    UpdateAgreementUseCase,
    DeleteAgreementUseCase,
  ],
  exports: [AGREEMENT_REPOSITORY_TOKEN],
})
export class AgreementModule {}
