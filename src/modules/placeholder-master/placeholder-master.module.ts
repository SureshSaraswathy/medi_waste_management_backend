import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceholderMasterController } from './presentation/placeholder-master.controller';
import { PlaceholderMasterRepository } from './infrastructure/persistence/placeholder-master.repository';
import { PlaceholderMasterEntity } from './infrastructure/persistence/placeholder-master.entity';
import { CreatePlaceholderMasterUseCase } from './application/use-cases/create-placeholder-master.use-case';
import { GetPlaceholderMasterUseCase } from './application/use-cases/get-placeholder-master.use-case';
import { GetAllPlaceholderMasterUseCase } from './application/use-cases/get-all-placeholder-master.use-case';
import { UpdatePlaceholderMasterUseCase } from './application/use-cases/update-placeholder-master.use-case';
import { DeletePlaceholderMasterUseCase } from './application/use-cases/delete-placeholder-master.use-case';
import { PLACEHOLDER_MASTER_REPOSITORY_TOKEN } from './domain/interfaces/placeholder-master.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceholderMasterEntity], 'master')],
  controllers: [PlaceholderMasterController],
  providers: [
    {
      provide: PLACEHOLDER_MASTER_REPOSITORY_TOKEN,
      useClass: PlaceholderMasterRepository,
    },
    CreatePlaceholderMasterUseCase,
    GetPlaceholderMasterUseCase,
    GetAllPlaceholderMasterUseCase,
    UpdatePlaceholderMasterUseCase,
    DeletePlaceholderMasterUseCase,
  ],
  exports: [PLACEHOLDER_MASTER_REPOSITORY_TOKEN],
})
export class PlaceholderMasterModule {}
