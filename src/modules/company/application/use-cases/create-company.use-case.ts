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

    // Helper function to convert date string to Date object
    const parseDate = (dateString?: string): Date | null => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    // Extract additional fields that don't belong to domain entity
    const additionalFields = {
      gstin: createCompanyDto.gstin || null,
      pincode: createCompanyDto.pincode || null,
      state: createCompanyDto.state || null,
      prefix: createCompanyDto.prefix || null,
      // Address Information
      regdOfficeAddress: createCompanyDto.regdOfficeAddress || null,
      adminOfficeAddress: createCompanyDto.adminOfficeAddress || null,
      factoryAddress: createCompanyDto.factoryAddress || null,
      // Authorized Person Information
      authPersonName: createCompanyDto.authPersonName || null,
      authPersonDesignation: createCompanyDto.authPersonDesignation || null,
      authPersonDOB: parseDate(createCompanyDto.authPersonDOB),
      // PCB & Compliance
      pcbauthNum: createCompanyDto.pcbauthNum || null,
      hazardousWasteNum: createCompanyDto.hazardousWasteNum || null,
      // CTO (Consent To Operate) - Water
      ctoWaterNum: createCompanyDto.ctoWaterNum || null,
      ctoWaterDate: parseDate(createCompanyDto.ctoWaterDate),
      ctoWaterValidUpto: parseDate(createCompanyDto.ctoWaterValidUpto),
      // CTO (Consent To Operate) - Air
      ctoAirNum: createCompanyDto.ctoAirNum || null,
      ctoAirDate: parseDate(createCompanyDto.ctoAirDate),
      ctoAirValidUpto: parseDate(createCompanyDto.ctoAirValidUpto),
      // CTE (Consent To Establish) - Water
      cteWaterNum: createCompanyDto.cteWaterNum || null,
      cteWaterDate: parseDate(createCompanyDto.cteWaterDate),
      cteWaterValidUpto: parseDate(createCompanyDto.cteWaterValidUpto),
      // CTE (Consent To Establish) - Air
      cteAirNum: createCompanyDto.cteAirNum || null,
      cteAirDate: parseDate(createCompanyDto.cteAirDate),
      cteAirValidUpto: parseDate(createCompanyDto.cteAirValidUpto),
      // GST Details
      pcbZoneID: createCompanyDto.pcbZoneID || null,
      gstValidFrom: parseDate(createCompanyDto.gstValidFrom),
      gstRate: createCompanyDto.gstRate || null,
      // Contact Information
      contactNum: createCompanyDto.contactNum || null,
      webAddress: createCompanyDto.webAddress || null,
      companyEmail: createCompanyDto.companyEmail || null,
      // Bank & Payment Information
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
