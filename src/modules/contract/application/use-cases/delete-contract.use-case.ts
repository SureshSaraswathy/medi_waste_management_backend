import { Injectable, Inject } from '@nestjs/common';
import { IContractRepository, CONTRACT_REPOSITORY_TOKEN } from '../../domain/interfaces/contract.repository.interface';
import { ContractNotFoundException } from '../../domain/exceptions/contract.exceptions';

@Injectable()
export class DeleteContractUseCase {
  constructor(
    @Inject(CONTRACT_REPOSITORY_TOKEN)
    private readonly repository: IContractRepository,
  ) {}

  async execute(id: string, modifiedBy?: string | null): Promise<void> {
    const contract = await this.repository.findOne(id);
    if (!contract) {
      throw new ContractNotFoundException(id);
    }
    await this.repository.delete(id, modifiedBy);
  }
}
