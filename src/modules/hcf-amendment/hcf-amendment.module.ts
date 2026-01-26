import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HcfAmendmentController } from './presentation/hcf-amendment.controller';
import { HcfAmendmentRepository } from './infrastructure/persistence/hcf-amendment.repository';
import { HcfAmendmentEntity } from './infrastructure/persistence/hcf-amendment.entity';
import { CreateHcfAmendmentUseCase } from './application/use-cases/create-hcf-amendment.use-case';
import { GetHcfAmendmentUseCase } from './application/use-cases/get-hcf-amendment.use-case';
import { GetAllHcfAmendmentsUseCase } from './application/use-cases/get-all-hcf-amendments.use-case';
import { UpdateHcfAmendmentUseCase } from './application/use-cases/update-hcf-amendment.use-case';
import { DeleteHcfAmendmentUseCase } from './application/use-cases/delete-hcf-amendment.use-case';
import { HCF_AMENDMENT_REPOSITORY_TOKEN } from './domain/interfaces/hcf-amendment.repository.interface';
import { ExportModule } from '../export/export.module';
import { ExportDataProviderRegistry } from '../export/application/services/export-data-provider-registry.service';
import { ExportModule as ExportModuleEnum } from '../export/application/dto/export-request.dto';
import { HcfAmendmentExportProvider } from './infrastructure/providers/hcf-amendment-export.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([HcfAmendmentEntity], 'master'),
    ExportModule,
  ],
  controllers: [HcfAmendmentController],
  providers: [
    {
      provide: HCF_AMENDMENT_REPOSITORY_TOKEN,
      useClass: HcfAmendmentRepository,
    },
    CreateHcfAmendmentUseCase,
    GetHcfAmendmentUseCase,
    GetAllHcfAmendmentsUseCase,
    UpdateHcfAmendmentUseCase,
    DeleteHcfAmendmentUseCase,
    HcfAmendmentExportProvider,
  ],
  exports: [HCF_AMENDMENT_REPOSITORY_TOKEN],
})
export class HcfAmendmentModule implements OnModuleInit {
  constructor(
    private readonly exportRegistry: ExportDataProviderRegistry,
    private readonly hcfAmendmentExportProvider: HcfAmendmentExportProvider,
  ) {}

  onModuleInit() {
    // Register HCF Amendment export provider
    this.exportRegistry.register(ExportModuleEnum.HCF_AMENDMENT, this.hcfAmendmentExportProvider);
  }
}
