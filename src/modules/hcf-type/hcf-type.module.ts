import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HcfTypeController } from './presentation/hcf-type.controller';
import { HcfTypeRepository } from './infrastructure/persistence/hcf-type.repository';
import { HcfTypeEntity } from './infrastructure/persistence/hcf-type.entity';
import { CreateHcfTypeUseCase } from './application/use-cases/create-hcf-type.use-case';
import { GetHcfTypeUseCase } from './application/use-cases/get-hcf-type.use-case';
import { GetAllHcfTypesUseCase } from './application/use-cases/get-all-hcf-types.use-case';
import { UpdateHcfTypeUseCase } from './application/use-cases/update-hcf-type.use-case';
import { DeleteHcfTypeUseCase } from './application/use-cases/delete-hcf-type.use-case';
import { HCF_TYPE_REPOSITORY_TOKEN } from './domain/interfaces/hcf-type.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([HcfTypeEntity], 'master')],
  controllers: [HcfTypeController],
  providers: [
    {
      provide: HCF_TYPE_REPOSITORY_TOKEN,
      useClass: HcfTypeRepository,
    },
    CreateHcfTypeUseCase,
    GetHcfTypeUseCase,
    GetAllHcfTypesUseCase,
    UpdateHcfTypeUseCase,
    DeleteHcfTypeUseCase,
  ],
  exports: [HCF_TYPE_REPOSITORY_TOKEN],
})
export class HcfTypeModule {}
