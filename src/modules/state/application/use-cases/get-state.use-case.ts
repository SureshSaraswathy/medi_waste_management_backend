import { Injectable, Inject } from '@nestjs/common';
import { IStateRepository, STATE_REPOSITORY_TOKEN } from '../../domain/interfaces/state.repository.interface';
import { State } from '../../domain/entities/state.domain.entity';
import { StateNotFoundException } from '../../domain/exceptions/state.exceptions';

@Injectable()
export class GetStateUseCase {
  constructor(
    @Inject(STATE_REPOSITORY_TOKEN)
    private readonly stateRepository: IStateRepository,
  ) {}

  async execute(stateId: string): Promise<State> {
    const state = await this.stateRepository.findById(stateId);
    if (!state) {
      throw new StateNotFoundException(stateId);
    }
    return state;
  }
}
