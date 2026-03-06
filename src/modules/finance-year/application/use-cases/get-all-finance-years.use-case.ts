import { Injectable, Inject } from '@nestjs/common';
import { IFinanceYearRepository, FINANCE_YEAR_REPOSITORY_TOKEN } from '../../domain/interfaces/finance-year.repository.interface';
import { FinanceYear } from '../../domain/entities/finance-year.domain.entity';

@Injectable()
export class GetAllFinanceYearsUseCase {
  constructor(
    @Inject(FINANCE_YEAR_REPOSITORY_TOKEN)
    private readonly financeYearRepository: IFinanceYearRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<FinanceYear[]> {
    if (activeOnly) {
      return this.financeYearRepository.findAllActiveOrderedByStartDate();
    }
    return this.financeYearRepository.findAllOrderedByStartDate();
  }
}
