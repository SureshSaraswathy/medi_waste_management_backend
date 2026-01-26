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

    // Persist through repository
    return this.companyRepository.create(company);
  }
}
