import { Injectable, Inject } from '@nestjs/common';
import { IStateRepository, STATE_REPOSITORY_TOKEN } from '../../domain/interfaces/state.repository.interface';
import { StateNotFoundException } from '../../domain/exceptions/state.exceptions';

@Injectable()
export class DeleteStateUseCase {
  constructor(
    @Inject(STATE_REPOSITORY_TOKEN)
    private readonly stateRepository: IStateRepository,
  ) {}

  async execute(stateId: string, modifiedBy?: string): Promise<void> {
    const state = await this.stateRepository.findById(stateId);
    if (!state) {
      throw new StateNotFoundException(stateId);
    }

    // Soft delete domain entity
    state.softDelete(modifiedBy || null);

    // Persist through repository
    await this.stateRepository.softDelete(stateId);
  }
}
