import { Injectable, Inject } from '@nestjs/common';
import { IFinanceYearRepository, FINANCE_YEAR_REPOSITORY_TOKEN } from '../../domain/interfaces/finance-year.repository.interface';
import { FinanceYearNotFoundException } from '../../domain/exceptions/finance-year.exceptions';

@Injectable()
export class DeleteFinanceYearUseCase {
  constructor(
    @Inject(FINANCE_YEAR_REPOSITORY_TOKEN)
    private readonly financeYearRepository: IFinanceYearRepository,
  ) {}

  async execute(financeYearId: string, modifiedBy?: string): Promise<void> {
    const financeYear = await this.financeYearRepository.findById(financeYearId);
    if (!financeYear) {
      throw new FinanceYearNotFoundException(financeYearId);
    }

    // Soft delete
    await this.financeYearRepository.softDelete(financeYearId);
  }
}
