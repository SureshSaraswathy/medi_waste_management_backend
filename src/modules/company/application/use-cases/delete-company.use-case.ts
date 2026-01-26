import { Injectable, Inject } from '@nestjs/common';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../domain/interfaces/company.repository.interface';
import { CompanyNotFoundException } from '../../domain/exceptions/company.exceptions';

@Injectable()
export class DeleteCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(companyId: string, modifiedBy?: string): Promise<void> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    // Soft delete domain entity
    company.softDelete(modifiedBy || null);

    // Persist through repository
    await this.companyRepository.delete(companyId);
  }
}
