import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistrictController } from './presentation/district.controller';
import { DistrictRepository } from './infrastructure/persistence/district.repository';
import { DistrictEntity } from './infrastructure/persistence/district.entity';
import { CreateDistrictUseCase } from './application/use-cases/create-district.use-case';
import { GetDistrictUseCase } from './application/use-cases/get-district.use-case';
import { GetAllDistrictsUseCase } from './application/use-cases/get-all-districts.use-case';
import { UpdateDistrictUseCase } from './application/use-cases/update-district.use-case';
import { DeleteDistrictUseCase } from './application/use-cases/delete-district.use-case';
import { DISTRICT_REPOSITORY_TOKEN } from './domain/interfaces/district.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([DistrictEntity], 'master')],
  controllers: [DistrictController],
  providers: [
    {
      provide: DISTRICT_REPOSITORY_TOKEN,
      useClass: DistrictRepository,
    },
    CreateDistrictUseCase,
    GetDistrictUseCase,
    GetAllDistrictsUseCase,
    UpdateDistrictUseCase,
    DeleteDistrictUseCase,
  ],
  exports: [DISTRICT_REPOSITORY_TOKEN],
})
export class DistrictModule {}
