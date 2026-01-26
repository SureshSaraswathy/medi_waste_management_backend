import { Injectable, Inject } from '@nestjs/common';
import { IStateRepository, STATE_REPOSITORY_TOKEN } from '../../domain/interfaces/state.repository.interface';
import { State } from '../../domain/entities/state.domain.entity';
import { CreateStateDto } from '../dto/create-state.dto';
import {
  DuplicateStateCodeException,
  DuplicateStateNameException,
} from '../../domain/exceptions/state.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateStateUseCase {
  constructor(
    @Inject(STATE_REPOSITORY_TOKEN)
    private readonly stateRepository: IStateRepository,
  ) {}

  async execute(createStateDto: CreateStateDto, createdBy?: string): Promise<State> {
    // Check for duplicate state code
    const existingByCode = await this.stateRepository.findByStateCode(createStateDto.stateCode);
    if (existingByCode) {
      throw new DuplicateStateCodeException(createStateDto.stateCode);
    }

    // Check for duplicate state name
    const existingByName = await this.stateRepository.findByStateName(createStateDto.stateName);
    if (existingByName) {
      throw new DuplicateStateNameException(createStateDto.stateName);
    }

    // Create domain entity
    const state = State.create({
      stateId: randomUUID(),
      stateCode: createStateDto.stateCode,
      stateName: createStateDto.stateName,
      createdBy: createdBy || null,
    });

    // Persist through repository
    return this.stateRepository.create(state);
  }
}
