import { Injectable, Inject } from '@nestjs/common';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../domain/interfaces/company.repository.interface';
import { Company } from '../../domain/entities/company.domain.entity';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyNotFoundException } from '../../domain/exceptions/company.exceptions';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(companyId: string, updateCompanyDto: UpdateCompanyDto, modifiedBy?: string): Promise<Company> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    // Update domain entity
    company.update({
      companyCode: updateCompanyDto.companyCode,
      companyName: updateCompanyDto.companyName,
      status: updateCompanyDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist through repository
    return this.companyRepository.update(companyId, company);
  }
}
