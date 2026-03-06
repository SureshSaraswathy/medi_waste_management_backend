import { Injectable, Inject } from '@nestjs/common';
import { IFinanceYearRepository, FINANCE_YEAR_REPOSITORY_TOKEN } from '../../domain/interfaces/finance-year.repository.interface';
import { FinanceYear } from '../../domain/entities/finance-year.domain.entity';
import { UpdateFinanceYearDto } from '../dto/update-finance-year.dto';
import { FinanceYearNotFoundException } from '../../domain/exceptions/finance-year.exceptions';

@Injectable()
export class UpdateFinanceYearUseCase {
  constructor(
    @Inject(FINANCE_YEAR_REPOSITORY_TOKEN)
    private readonly financeYearRepository: IFinanceYearRepository,
  ) {}

  async execute(financeYearId: string, updateFinanceYearDto: UpdateFinanceYearDto, modifiedBy?: string): Promise<FinanceYear> {
    const financeYear = await this.financeYearRepository.findById(financeYearId);
    if (!financeYear) {
      throw new FinanceYearNotFoundException(financeYearId);
    }

    // Update finance year (only status can be updated)
    financeYear.update({
      status: updateFinanceYearDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist changes
    return this.financeYearRepository.update(financeYearId, financeYear);
  }
}
