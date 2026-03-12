import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IContractRepository, CONTRACT_REPOSITORY_TOKEN } from '../../domain/interfaces/contract.repository.interface';
import { Contract } from '../../domain/entities/contract.domain.entity';
import { UpdateContractDto } from '../dto/update-contract.dto';
import { ContractNotFoundException } from '../../domain/exceptions/contract.exceptions';

@Injectable()
export class UpdateContractUseCase {
  constructor(
    @Inject(CONTRACT_REPOSITORY_TOKEN)
    private readonly repository: IContractRepository,
  ) {}

  async execute(id: string, dto: UpdateContractDto, modifiedBy?: string | null): Promise<Contract> {
    const contract = await this.repository.findOne(id);
    if (!contract) {
      throw new ContractNotFoundException(id);
    }

    // Only allow updating agreementTemplateId if contract status is Draft
    if (dto.agreementTemplateId !== undefined && contract.status !== 'Draft') {
      throw new BadRequestException('Agreement Template can only be changed when contract status is Draft.');
    }

    contract.update({
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      billingType: dto.billingType,
      status: dto.status,
      agreementTemplateId: dto.agreementTemplateId,
      modifiedBy: modifiedBy || null,
    });

    return this.repository.update(contract);
  }
}
