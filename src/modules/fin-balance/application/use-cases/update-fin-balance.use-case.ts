import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FinBalance } from '../../domain/entities/fin-balance.domain.entity';
import { IFinBalanceRepository, FIN_BALANCE_REPOSITORY_TOKEN } from '../../domain/interfaces/fin-balance.repository.interface';
import { UpdateFinBalanceDto } from '../dto/update-fin-balance.dto';

@Injectable()
export class UpdateFinBalanceUseCase {
  constructor(
    @Inject(FIN_BALANCE_REPOSITORY_TOKEN)
    private readonly finBalanceRepository: IFinBalanceRepository,
  ) {}

  async execute(finBalanceId: string, updateDto: UpdateFinBalanceDto, modifiedBy?: string): Promise<FinBalance> {
    const finBalance = await this.finBalanceRepository.findById(finBalanceId);
    
    if (!finBalance) {
      throw new NotFoundException(`Financial balance with ID ${finBalanceId} not found`);
    }

    // Update opening balance and reset current balance
    finBalance.updateOpeningBalance(updateDto.openingBalance, modifiedBy);

    if (updateDto.notes !== undefined) {
      finBalance.notes = updateDto.notes;
    }

    return await this.finBalanceRepository.update(finBalance);
  }
}
