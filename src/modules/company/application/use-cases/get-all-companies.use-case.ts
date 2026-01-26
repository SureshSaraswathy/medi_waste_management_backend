import { Injectable, Inject } from '@nestjs/common';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../domain/interfaces/company.repository.interface';
import { Company } from '../../domain/entities/company.domain.entity';

@Injectable()
export class GetAllCompaniesUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<Company[]> {
    if (activeOnly) {
      return this.companyRepository.findActive();
    }
    return this.companyRepository.findAll();
  }
}
