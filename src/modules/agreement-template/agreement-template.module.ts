import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgreementTemplateEntity } from './infrastructure/persistence/agreement-template.entity';
import { AgreementTemplateController } from './presentation/agreement-template.controller';
import { AgreementTemplateRepository } from './infrastructure/persistence/agreement-template.repository';
import { CreateAgreementTemplateUseCase } from './application/use-cases/create-agreement-template.use-case';
import { GetAgreementTemplateUseCase } from './application/use-cases/get-agreement-template.use-case';
import { GetAllAgreementTemplatesUseCase } from './application/use-cases/get-all-agreement-templates.use-case';
import { UpdateAgreementTemplateUseCase } from './application/use-cases/update-agreement-template.use-case';
import { DeleteAgreementTemplateUseCase } from './application/use-cases/delete-agreement-template.use-case';
import { AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from './domain/interfaces/agreement-template.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgreementTemplateEntity], 'master'),
  ],
  controllers: [AgreementTemplateController],
  providers: [
    {
      provide: AGREEMENT_TEMPLATE_REPOSITORY_TOKEN,
      useClass: AgreementTemplateRepository,
    },
    CreateAgreementTemplateUseCase,
    GetAgreementTemplateUseCase,
    GetAllAgreementTemplatesUseCase,
    UpdateAgreementTemplateUseCase,
    DeleteAgreementTemplateUseCase,
  ],
  exports: [AGREEMENT_TEMPLATE_REPOSITORY_TOKEN],
})
export class AgreementTemplateModule {}
