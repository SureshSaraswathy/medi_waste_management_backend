import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrequencyController } from './presentation/frequency.controller';
import { FrequencyRepository } from './infrastructure/persistence/frequency.repository';
import { FrequencyEntity } from './infrastructure/persistence/frequency.entity';
import { CreateFrequencyUseCase } from './application/use-cases/create-frequency.use-case';
import { GetFrequencyUseCase } from './application/use-cases/get-frequency.use-case';
import { GetAllFrequenciesUseCase } from './application/use-cases/get-all-frequencies.use-case';
import { UpdateFrequencyUseCase } from './application/use-cases/update-frequency.use-case';
import { DeleteFrequencyUseCase } from './application/use-cases/delete-frequency.use-case';
import { FREQUENCY_REPOSITORY_TOKEN } from './domain/interfaces/frequency.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([FrequencyEntity], 'master')],
  controllers: [FrequencyController],
  providers: [
    {
      provide: FREQUENCY_REPOSITORY_TOKEN,
      useClass: FrequencyRepository,
    },
    CreateFrequencyUseCase,
    GetFrequencyUseCase,
    GetAllFrequenciesUseCase,
    UpdateFrequencyUseCase,
    DeleteFrequencyUseCase,
  ],
  exports: [FREQUENCY_REPOSITORY_TOKEN],
})
export class FrequencyModule {}
