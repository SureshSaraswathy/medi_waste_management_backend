import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceYearController } from './presentation/finance-year.controller';
import { FinanceYearRepository } from './infrastructure/persistence/finance-year.repository';
import { FinanceYearEntity } from './infrastructure/persistence/finance-year.entity';
import { CreateFinanceYearUseCase } from './application/use-cases/create-finance-year.use-case';
import { GetFinanceYearUseCase } from './application/use-cases/get-finance-year.use-case';
import { GetAllFinanceYearsUseCase } from './application/use-cases/get-all-finance-years.use-case';
import { UpdateFinanceYearUseCase } from './application/use-cases/update-finance-year.use-case';
import { DeleteFinanceYearUseCase } from './application/use-cases/delete-finance-year.use-case';
import { FINANCE_YEAR_REPOSITORY_TOKEN } from './domain/interfaces/finance-year.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceYearEntity], 'master')],
  controllers: [FinanceYearController],
  providers: [
    {
      provide: FINANCE_YEAR_REPOSITORY_TOKEN,
      useClass: FinanceYearRepository,
    },
    CreateFinanceYearUseCase,
    GetFinanceYearUseCase,
    GetAllFinanceYearsUseCase,
    UpdateFinanceYearUseCase,
    DeleteFinanceYearUseCase,
  ],
  exports: [FINANCE_YEAR_REPOSITORY_TOKEN],
})
export class FinanceYearModule {}
