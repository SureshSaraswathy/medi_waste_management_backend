import { Injectable, Inject } from '@nestjs/common';
import { IContractRepository, CONTRACT_REPOSITORY_TOKEN } from '../../domain/interfaces/contract.repository.interface';
import { Contract } from '../../domain/entities/contract.domain.entity';
import { CreateContractDto } from '../dto/create-contract.dto';
import { ContractAlreadyExistsException } from '../../domain/exceptions/contract.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateContractUseCase {
  constructor(
    @Inject(CONTRACT_REPOSITORY_TOKEN)
    private readonly repository: IContractRepository,
  ) {}

  async execute(dto: CreateContractDto, createdBy?: string | null): Promise<Contract> {
    // Check if contract number already exists for this company
    const existing = await this.repository.findAll(dto.companyId);
    const duplicate = existing.find(c => c.contractNum === dto.contractNum && !c.isDeleted);
    if (duplicate) {
      throw new ContractAlreadyExistsException(dto.contractNum, dto.companyId);
    }

    const contractId = randomUUID();
    const contractID = `CNT${String(Date.now()).slice(-6)}`;
    
    const contract = Contract.create({
      contractId,
      contractID,
      contractNum: dto.contractNum,
      companyId: dto.companyId,
      hcfId: dto.hcfId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      billingType: dto.billingType,
      status: dto.status || 'Draft',
      createdBy: createdBy || null,
    });

    return this.repository.create(contract);
  }
}
