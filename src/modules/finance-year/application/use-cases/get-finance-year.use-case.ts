import { Injectable, Inject } from '@nestjs/common';
import { IFinanceYearRepository, FINANCE_YEAR_REPOSITORY_TOKEN } from '../../domain/interfaces/finance-year.repository.interface';
import { FinanceYear } from '../../domain/entities/finance-year.domain.entity';
import { FinanceYearNotFoundException } from '../../domain/exceptions/finance-year.exceptions';

@Injectable()
export class GetFinanceYearUseCase {
  constructor(
    @Inject(FINANCE_YEAR_REPOSITORY_TOKEN)
    private readonly financeYearRepository: IFinanceYearRepository,
  ) {}

  async execute(financeYearId: string): Promise<FinanceYear> {
    const financeYear = await this.financeYearRepository.findById(financeYearId);
    if (!financeYear) {
      throw new FinanceYearNotFoundException(financeYearId);
    }
    return financeYear;
  }
}
