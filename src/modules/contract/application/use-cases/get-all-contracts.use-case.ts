import { Injectable, Inject } from '@nestjs/common';
import { IContractRepository, CONTRACT_REPOSITORY_TOKEN } from '../../domain/interfaces/contract.repository.interface';
import { Contract } from '../../domain/entities/contract.domain.entity';

@Injectable()
export class GetAllContractsUseCase {
  constructor(
    @Inject(CONTRACT_REPOSITORY_TOKEN)
    private readonly repository: IContractRepository,
  ) {}

  async execute(companyId?: string, status?: string): Promise<Contract[]> {
    return this.repository.findAll(companyId, status);
  }
}
