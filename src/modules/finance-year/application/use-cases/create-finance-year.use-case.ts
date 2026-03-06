import { Injectable, Inject } from '@nestjs/common';
import { IFinanceYearRepository, FINANCE_YEAR_REPOSITORY_TOKEN } from '../../domain/interfaces/finance-year.repository.interface';
import { FinanceYear } from '../../domain/entities/finance-year.domain.entity';
import { CreateFinanceYearDto } from '../dto/create-finance-year.dto';
import {
  DuplicateFinanceYearException,
  PastFinanceYearException,
} from '../../domain/exceptions/finance-year.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateFinanceYearUseCase {
  constructor(
    @Inject(FINANCE_YEAR_REPOSITORY_TOKEN)
    private readonly financeYearRepository: IFinanceYearRepository,
  ) {}

  async execute(createFinanceYearDto: CreateFinanceYearDto, createdBy?: string): Promise<FinanceYear> {
    const { startYear } = createFinanceYearDto;
    
    // Check if start year is in the past
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed (0 = January)
    
    // Determine current financial year start year
    // If current month is Jan-Mar, current FY started last year
    // If current month is Apr-Dec, current FY started this year
    const currentFYStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    
    // Prevent creating past financial years
    if (startYear < currentFYStartYear) {
      throw new PastFinanceYearException(startYear);
    }
    
    // Generate Finance Year string
    const finYear = FinanceYear.generateFinanceYear(startYear);
    
    // Check for duplicate finance year
    const existing = await this.financeYearRepository.findByFinYear(finYear);
    if (existing) {
      throw new DuplicateFinanceYearException(finYear);
    }

    // Create domain entity
    const financeYear = FinanceYear.create({
      financeYearId: randomUUID(),
      startYear: startYear,
      createdBy: createdBy || null,
    });

    // Persist through repository
    return this.financeYearRepository.create(financeYear);
  }
}
