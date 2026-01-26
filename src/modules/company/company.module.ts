import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

// Infrastructure
import { CompanyEntity } from './infrastructure/persistence/company.entity';
import { CompanyRepository } from './infrastructure/persistence/company.repository';

// Domain
import { COMPANY_REPOSITORY_TOKEN } from './domain/interfaces/company.repository.interface';

// Application
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { GetCompanyUseCase } from './application/use-cases/get-company.use-case';
import { GetAllCompaniesUseCase } from './application/use-cases/get-all-companies.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company.use-case';
import { DeleteCompanyUseCase } from './application/use-cases/delete-company.use-case';

// Presentation
import { CompanyController } from './presentation/company.controller';

/**
 * Company Module - Clean Architecture Structure
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyEntity], 'master'),
    AuthModule,
  ],
  controllers: [CompanyController],
  providers: [
    CompanyRepository,
    {
      provide: COMPANY_REPOSITORY_TOKEN,
      useClass: CompanyRepository,
    },
    CreateCompanyUseCase,
    GetCompanyUseCase,
    GetAllCompaniesUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase,
  ],
  exports: [
    COMPANY_REPOSITORY_TOKEN,
  ],
})
export class CompanyModule {}
