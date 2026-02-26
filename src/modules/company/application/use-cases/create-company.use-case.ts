import { Injectable, Inject } from '@nestjs/common';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../domain/interfaces/company.repository.interface';
import { Company } from '../../domain/entities/company.domain.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { DuplicateCompanyCodeException } from '../../domain/exceptions/company.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(createCompanyDto: CreateCompanyDto, createdBy?: string): Promise<Company> {
    // Check for duplicate company code
    const existing = await this.companyRepository.findByCode(createCompanyDto.companyCode);
    if (existing) {
      throw new DuplicateCompanyCodeException(createCompanyDto.companyCode);
    }

    // Create domain entity
    const company = Company.create({
      companyId: randomUUID(),
      companyCode: createCompanyDto.companyCode,
      companyName: createCompanyDto.companyName,
      createdBy: createdBy || null,
    });

    // Extract additional fields that don't belong to domain entity
    const additionalFields = {
      contactNum: createCompanyDto.contactNum || null,
      webAddress: createCompanyDto.webAddress || null,
      companyEmail: createCompanyDto.companyEmail || null,
      bankAccountName: createCompanyDto.bankAccountName || null,
      bankName: createCompanyDto.bankName || null,
      bankAccountNum: createCompanyDto.bankAccountNum || null,
      bankIFSCode: createCompanyDto.bankIFSCode || null,
      bankBranch: createCompanyDto.bankBranch || null,
      upiId: createCompanyDto.upiId || null,
      qrCode: createCompanyDto.qrCode || null,
    };

    // Persist through repository
    return this.companyRepository.create(company, additionalFields);
  }
}
