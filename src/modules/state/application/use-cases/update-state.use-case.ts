import { Injectable, Inject } from '@nestjs/common';
import { IStateRepository, STATE_REPOSITORY_TOKEN } from '../../domain/interfaces/state.repository.interface';
import { State } from '../../domain/entities/state.domain.entity';
import { UpdateStateDto } from '../dto/update-state.dto';
import { StateNotFoundException } from '../../domain/exceptions/state.exceptions';

@Injectable()
export class UpdateStateUseCase {
  constructor(
    @Inject(STATE_REPOSITORY_TOKEN)
    private readonly stateRepository: IStateRepository,
  ) {}

  async execute(stateId: string, updateStateDto: UpdateStateDto, modifiedBy?: string): Promise<State> {
    const state = await this.stateRepository.findById(stateId);
    if (!state) {
      throw new StateNotFoundException(stateId);
    }

    // Update domain entity
    state.update({
      status: updateStateDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist through repository
    return this.stateRepository.update(stateId, state);
  }
}
