import { Injectable, Inject } from '@nestjs/common';
import { IContractRepository, CONTRACT_REPOSITORY_TOKEN } from '../../domain/interfaces/contract.repository.interface';
import { Contract } from '../../domain/entities/contract.domain.entity';
import { CreateContractDto } from '../dto/create-contract.dto';
import { ContractAlreadyExistsException, ActiveContractExistsException } from '../../domain/exceptions/contract.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateContractUseCase {
  constructor(
    @Inject(CONTRACT_REPOSITORY_TOKEN)
    private readonly repository: IContractRepository,
  ) {}

  async execute(dto: CreateContractDto, createdBy?: string | null): Promise<Contract> {
    // Check if there's an existing non-expired contract for this HCF
    const existingContracts = await this.repository.findAll(undefined, undefined);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasActiveContract = existingContracts.some(contract => {
      if (contract.hcfId !== dto.hcfId || contract.isDeleted) {
        return false;
      }
      
      // Check if contract is not expired
      const endDate = new Date(contract.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      // Contract is active if:
      // 1. Status is 'Active' OR
      // 2. Status is 'Draft' OR
      // 3. End date is in the future (not expired)
      return contract.status === 'Active' || 
             contract.status === 'Draft' || 
             endDate >= today;
    });

    if (hasActiveContract) {
      throw new ActiveContractExistsException(dto.hcfId);
    }

    // Auto-generate contract number
    const contractNum = await this.generateContractNumber();

    const contractId = randomUUID();
    const contractID = `CNT${String(Date.now()).slice(-6)}`;
    
    const contract = Contract.create({
      contractId,
      contractID,
      contractNum,
      companyId: dto.companyId,
      hcfId: dto.hcfId,
      agreementTemplateId: dto.agreementTemplateId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      billingType: dto.billingType,
      status: dto.status || 'Draft',
      createdBy: createdBy || null,
    });

    return this.repository.create(contract);
  }

  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AGR-${year}-`;
    
    // Find the latest contract number for this year
    const contracts = await this.repository.findAll();
    const yearContracts = contracts.filter(
      (c) => c.contractNum.startsWith(prefix) && !c.isDeleted
    );
    
    if (yearContracts.length === 0) {
      return `${prefix}0001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearContracts.map((c) => {
      const seq = c.contractNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = maxSeq + 1;
    const nextSeqStr = nextSeq.toString().padStart(4, '0');
    
    return `${prefix}${nextSeqStr}`;
  }
}
