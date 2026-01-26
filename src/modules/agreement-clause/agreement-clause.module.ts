import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgreementClauseEntity } from './infrastructure/transaction/agreement-clause.entity';
import { AgreementClauseController } from './presentation/agreement-clause.controller';
import { AgreementClauseRepository } from './infrastructure/persistence/agreement-clause.repository';
import { CreateAgreementClauseUseCase } from './application/use-cases/create-agreement-clause.use-case';
import { GetAgreementClauseUseCase } from './application/use-cases/get-agreement-clause.use-case';
import { GetAllAgreementClausesUseCase } from './application/use-cases/get-all-agreement-clauses.use-case';
import { UpdateAgreementClauseUseCase } from './application/use-cases/update-agreement-clause.use-case';
import { DeleteAgreementClauseUseCase } from './application/use-cases/delete-agreement-clause.use-case';
import { ReorderAgreementClauseUseCase } from './application/use-cases/reorder-agreement-clause.use-case';
import { AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from './domain/interfaces/agreement-clause.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgreementClauseEntity], 'transaction'),
  ],
  controllers: [AgreementClauseController],
  providers: [
    {
      provide: AGREEMENT_CLAUSE_REPOSITORY_TOKEN,
      useClass: AgreementClauseRepository,
    },
    CreateAgreementClauseUseCase,
    GetAgreementClauseUseCase,
    GetAllAgreementClausesUseCase,
    UpdateAgreementClauseUseCase,
    DeleteAgreementClauseUseCase,
    ReorderAgreementClauseUseCase,
  ],
  exports: [AGREEMENT_CLAUSE_REPOSITORY_TOKEN],
})
export class AgreementClauseModule {}
