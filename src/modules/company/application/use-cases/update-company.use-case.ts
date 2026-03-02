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

    // Helper function to convert date string to Date object
    const parseDate = (dateString?: string): Date | undefined => {
      if (dateString === undefined) return undefined;
      if (!dateString) return undefined;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    };

    // Extract additional fields that don't belong to domain entity
    const additionalFields = {
      gstin: updateCompanyDto.gstin !== undefined ? updateCompanyDto.gstin : undefined,
      pincode: updateCompanyDto.pincode !== undefined ? updateCompanyDto.pincode : undefined,
      state: updateCompanyDto.state !== undefined ? updateCompanyDto.state : undefined,
      prefix: updateCompanyDto.prefix !== undefined ? updateCompanyDto.prefix : undefined,
      // Address Information
      regdOfficeAddress: updateCompanyDto.regdOfficeAddress !== undefined ? updateCompanyDto.regdOfficeAddress : undefined,
      adminOfficeAddress: updateCompanyDto.adminOfficeAddress !== undefined ? updateCompanyDto.adminOfficeAddress : undefined,
      factoryAddress: updateCompanyDto.factoryAddress !== undefined ? updateCompanyDto.factoryAddress : undefined,
      // Authorized Person Information
      authPersonName: updateCompanyDto.authPersonName !== undefined ? updateCompanyDto.authPersonName : undefined,
      authPersonDesignation: updateCompanyDto.authPersonDesignation !== undefined ? updateCompanyDto.authPersonDesignation : undefined,
      authPersonDOB: updateCompanyDto.authPersonDOB !== undefined ? parseDate(updateCompanyDto.authPersonDOB) : undefined,
      // PCB & Compliance
      pcbauthNum: updateCompanyDto.pcbauthNum !== undefined ? updateCompanyDto.pcbauthNum : undefined,
      hazardousWasteNum: updateCompanyDto.hazardousWasteNum !== undefined ? updateCompanyDto.hazardousWasteNum : undefined,
      // CTO (Consent To Operate) - Water
      ctoWaterNum: updateCompanyDto.ctoWaterNum !== undefined ? updateCompanyDto.ctoWaterNum : undefined,
      ctoWaterDate: updateCompanyDto.ctoWaterDate !== undefined ? parseDate(updateCompanyDto.ctoWaterDate) : undefined,
      ctoWaterValidUpto: updateCompanyDto.ctoWaterValidUpto !== undefined ? parseDate(updateCompanyDto.ctoWaterValidUpto) : undefined,
      // CTO (Consent To Operate) - Air
      ctoAirNum: updateCompanyDto.ctoAirNum !== undefined ? updateCompanyDto.ctoAirNum : undefined,
      ctoAirDate: updateCompanyDto.ctoAirDate !== undefined ? parseDate(updateCompanyDto.ctoAirDate) : undefined,
      ctoAirValidUpto: updateCompanyDto.ctoAirValidUpto !== undefined ? parseDate(updateCompanyDto.ctoAirValidUpto) : undefined,
      // CTE (Consent To Establish) - Water
      cteWaterNum: updateCompanyDto.cteWaterNum !== undefined ? updateCompanyDto.cteWaterNum : undefined,
      cteWaterDate: updateCompanyDto.cteWaterDate !== undefined ? parseDate(updateCompanyDto.cteWaterDate) : undefined,
      cteWaterValidUpto: updateCompanyDto.cteWaterValidUpto !== undefined ? parseDate(updateCompanyDto.cteWaterValidUpto) : undefined,
      // CTE (Consent To Establish) - Air
      cteAirNum: updateCompanyDto.cteAirNum !== undefined ? updateCompanyDto.cteAirNum : undefined,
      cteAirDate: updateCompanyDto.cteAirDate !== undefined ? parseDate(updateCompanyDto.cteAirDate) : undefined,
      cteAirValidUpto: updateCompanyDto.cteAirValidUpto !== undefined ? parseDate(updateCompanyDto.cteAirValidUpto) : undefined,
      // GST Details
      pcbZoneID: updateCompanyDto.pcbZoneID !== undefined ? updateCompanyDto.pcbZoneID : undefined,
      gstValidFrom: updateCompanyDto.gstValidFrom !== undefined ? parseDate(updateCompanyDto.gstValidFrom) : undefined,
      gstRate: updateCompanyDto.gstRate !== undefined ? updateCompanyDto.gstRate : undefined,
      // Contact Information
      contactNum: updateCompanyDto.contactNum !== undefined ? updateCompanyDto.contactNum : undefined,
      webAddress: updateCompanyDto.webAddress !== undefined ? updateCompanyDto.webAddress : undefined,
      companyEmail: updateCompanyDto.companyEmail !== undefined ? updateCompanyDto.companyEmail : undefined,
      // Bank & Payment Information
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
