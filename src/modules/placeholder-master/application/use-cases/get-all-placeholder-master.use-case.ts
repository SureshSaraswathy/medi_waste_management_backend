import { Injectable, Inject } from '@nestjs/common';
import { IPlaceholderMasterRepository, PLACEHOLDER_MASTER_REPOSITORY_TOKEN } from '../../domain/interfaces/placeholder-master.repository.interface';
import { PlaceholderMaster } from '../../domain/entities/placeholder-master.domain.entity';

@Injectable()
export class GetAllPlaceholderMasterUseCase {
  constructor(
    @Inject(PLACEHOLDER_MASTER_REPOSITORY_TOKEN)
    private readonly placeholderRepository: IPlaceholderMasterRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<PlaceholderMaster[]> {
    if (activeOnly) {
      return this.placeholderRepository.findAllActive();
    }
    return this.placeholderRepository.findAll();
  }
}
