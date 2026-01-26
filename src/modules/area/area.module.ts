import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaController } from './presentation/area.controller';
import { AreaRepository } from './infrastructure/persistence/area.repository';
import { AreaEntity } from './infrastructure/persistence/area.entity';
import { CreateAreaUseCase } from './application/use-cases/create-area.use-case';
import { GetAreaUseCase } from './application/use-cases/get-area.use-case';
import { GetAllAreasUseCase } from './application/use-cases/get-all-areas.use-case';
import { UpdateAreaUseCase } from './application/use-cases/update-area.use-case';
import { DeleteAreaUseCase } from './application/use-cases/delete-area.use-case';
import { AREA_REPOSITORY_TOKEN } from './domain/interfaces/area.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity], 'master')],
  controllers: [AreaController],
  providers: [
    {
      provide: AREA_REPOSITORY_TOKEN,
      useClass: AreaRepository,
    },
    CreateAreaUseCase,
    GetAreaUseCase,
    GetAllAreasUseCase,
    UpdateAreaUseCase,
    DeleteAreaUseCase,
  ],
  exports: [AREA_REPOSITORY_TOKEN],
})
export class AreaModule {}
