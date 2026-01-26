import { Injectable, Inject } from '@nestjs/common';
import { IContractRepository, CONTRACT_REPOSITORY_TOKEN } from '../../domain/interfaces/contract.repository.interface';
import { Contract } from '../../domain/entities/contract.domain.entity';
import { ContractNotFoundException } from '../../domain/exceptions/contract.exceptions';

@Injectable()
export class GetContractUseCase {
  constructor(
    @Inject(CONTRACT_REPOSITORY_TOKEN)
    private readonly repository: IContractRepository,
  ) {}

  async execute(id: string): Promise<Contract> {
    const contract = await this.repository.findOne(id);
    if (!contract) {
      throw new ContractNotFoundException(id);
    }
    return contract;
  }
}
