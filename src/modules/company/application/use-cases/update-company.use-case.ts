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

    // Extract additional fields that don't belong to domain entity
    const additionalFields = {
      contactNum: updateCompanyDto.contactNum !== undefined ? updateCompanyDto.contactNum : undefined,
      webAddress: updateCompanyDto.webAddress !== undefined ? updateCompanyDto.webAddress : undefined,
      companyEmail: updateCompanyDto.companyEmail !== undefined ? updateCompanyDto.companyEmail : undefined,
      bankAccountName: updateCompanyDto.bankAccountName !== undefined ? updateCompanyDto.bankAccountName : undefined,
      bankName: updateCompanyDto.bankName !== undefined ? updateCompanyDto.bankName : undefined,
      bankAccountNum: updateCompanyDto.bankAccountNum !== undefined ? updateCompanyDto.bankAccountNum : undefined,
      bankIFSCode: updateCompanyDto.bankIFSCode !== undefined ? updateCompanyDto.bankIFSCode : undefined,
      bankBranch: updateCompanyDto.bankBranch !== undefined ? updateCompanyDto.bankBranch : undefined,
      upiId: updateCompanyDto.upiId !== undefined ? updateCompanyDto.upiId : undefined,
      qrCode: updateCompanyDto.qrCode !== undefined ? updateCompanyDto.qrCode : undefined,
    };

    // Persist through repository
    return this.companyRepository.update(companyId, company, additionalFields);
  }
}
