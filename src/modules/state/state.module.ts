import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateController } from './presentation/state.controller';
import { StateRepository } from './infrastructure/persistence/state.repository';
import { StateEntity } from './infrastructure/persistence/state.entity';
import { CreateStateUseCase } from './application/use-cases/create-state.use-case';
import { GetStateUseCase } from './application/use-cases/get-state.use-case';
import { GetAllStatesUseCase } from './application/use-cases/get-all-states.use-case';
import { UpdateStateUseCase } from './application/use-cases/update-state.use-case';
import { DeleteStateUseCase } from './application/use-cases/delete-state.use-case';
import { STATE_REPOSITORY_TOKEN } from './domain/interfaces/state.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([StateEntity], 'master')],
  controllers: [StateController],
  providers: [
    {
      provide: STATE_REPOSITORY_TOKEN,
      useClass: StateRepository,
    },
    CreateStateUseCase,
    GetStateUseCase,
    GetAllStatesUseCase,
    UpdateStateUseCase,
    DeleteStateUseCase,
  ],
  exports: [STATE_REPOSITORY_TOKEN],
})
export class StateModule {}
