import { Injectable, Inject } from '@nestjs/common';
import { IStateRepository, STATE_REPOSITORY_TOKEN } from '../../domain/interfaces/state.repository.interface';
import { State } from '../../domain/entities/state.domain.entity';

@Injectable()
export class GetAllStatesUseCase {
  constructor(
    @Inject(STATE_REPOSITORY_TOKEN)
    private readonly stateRepository: IStateRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<State[]> {
    if (activeOnly) {
      return this.stateRepository.findAllActive();
    }
    return this.stateRepository.findAll();
  }
}
