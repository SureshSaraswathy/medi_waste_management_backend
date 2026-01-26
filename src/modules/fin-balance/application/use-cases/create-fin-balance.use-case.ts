import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FinBalance } from '../../domain/entities/fin-balance.domain.entity';
import { IFinBalanceRepository, FIN_BALANCE_REPOSITORY_TOKEN } from '../../domain/interfaces/fin-balance.repository.interface';
import { CreateFinBalanceDto } from '../dto/create-fin-balance.dto';

@Injectable()
export class CreateFinBalanceUseCase {
  constructor(
    @Inject(FIN_BALANCE_REPOSITORY_TOKEN)
    private readonly finBalanceRepository: IFinBalanceRepository,
  ) {}

  async execute(createDto: CreateFinBalanceDto, createdBy?: string): Promise<FinBalance> {
    // Check if balance already exists for this company-HCF combination
    const existing = await this.finBalanceRepository.findByCompanyAndHcf(
      createDto.companyId,
      createDto.hcfId
    );

    if (existing) {
      throw new BadRequestException(
        `Financial balance already exists for this Company-HCF combination`
      );
    }

    const finBalance = FinBalance.create({
      finBalanceId: randomUUID(),
      companyId: createDto.companyId,
      hcfId: createDto.hcfId,
      openingBalance: createDto.openingBalance,
      currentBalance: createDto.currentBalance ?? createDto.openingBalance,
      isManual: true,
      notes: createDto.notes ?? null,
      createdBy,
    });

    return await this.finBalanceRepository.create(finBalance);
  }
}
