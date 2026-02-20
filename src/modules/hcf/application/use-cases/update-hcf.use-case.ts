import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { Hcf } from '../../domain/entities/hcf.domain.entity';
import { UpdateHcfDto } from '../dto/update-hcf.dto';
import { HcfNotFoundException } from '../../domain/exceptions/hcf.exceptions';
import { PasswordService } from '../../../user/application/services/password.service';

@Injectable()
export class UpdateHcfUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(hcfId: string, updateHcfDto: UpdateHcfDto, modifiedBy?: string): Promise<Hcf> {
    const hcf = await this.hcfRepository.findById(hcfId);
    if (!hcf) {
      throw new HcfNotFoundException(hcfId);
    }

    // Handle loginEnabled toggle
    if (updateHcfDto.loginEnabled !== undefined) {
      if (updateHcfDto.loginEnabled && !hcf.loginEnabled) {
        // Enabling login - if no password hash exists, generate temporary password
        if (!hcf.passwordHash) {
          const temporaryPassword = this.passwordService.generateTemporaryPassword();
          const passwordHash = await this.passwordService.hashPassword(temporaryPassword);
          const temporaryPasswordExpiry = this.passwordService.getTemporaryPasswordExpiry();
          
          (hcf as any).passwordHash = passwordHash;
          (hcf as any).temporaryPassword = temporaryPassword;
          (hcf as any).temporaryPasswordExpiry = temporaryPasswordExpiry;
          (hcf as any).forcePasswordChange = true;
        }
        hcf.enableLogin();
      } else if (!updateHcfDto.loginEnabled && hcf.loginEnabled) {
        // Disabling login
        hcf.disableLogin();
      }
    }

    hcf.update({
      hcfName: updateHcfDto.hcfName,
      hcfShortName: updateHcfDto.hcfShortName,
      areaId: updateHcfDto.areaId,
      pincode: updateHcfDto.pincode,
      district: updateHcfDto.district,
      stateCode: updateHcfDto.stateCode,
      groupCode: updateHcfDto.groupCode,
      pcbZone: updateHcfDto.pcbZone,
      billingName: updateHcfDto.billingName,
      billingAddress: updateHcfDto.billingAddress,
      serviceAddress: updateHcfDto.serviceAddress,
      gstin: updateHcfDto.gstin,
      regnNum: updateHcfDto.regnNum,
      hospRegnDate: updateHcfDto.hospRegnDate,
      billingType: updateHcfDto.billingType,
      advAmount: updateHcfDto.advAmount,
      billingOption: updateHcfDto.billingOption,
      bedCount: updateHcfDto.bedCount,
      bedRate: updateHcfDto.bedRate,
      kgRate: updateHcfDto.kgRate,
      lumpsum: updateHcfDto.lumpsum,
      accountsLandline: updateHcfDto.accountsLandline,
      accountsMobile: updateHcfDto.accountsMobile,
      accountsEmail: updateHcfDto.accountsEmail,
      contactName: updateHcfDto.contactName,
      contactDesignation: updateHcfDto.contactDesignation,
      contactMobile: updateHcfDto.contactMobile,
      contactEmail: updateHcfDto.contactEmail,
      agrSignAuthName: updateHcfDto.agrSignAuthName,
      agrSignAuthDesignation: updateHcfDto.agrSignAuthDesignation,
      drName: updateHcfDto.drName,
      drPhNo: updateHcfDto.drPhNo,
      drEmail: updateHcfDto.drEmail,
      serviceStartDate: updateHcfDto.serviceStartDate,
      serviceEndDate: updateHcfDto.serviceEndDate,
      category: updateHcfDto.category,
      route: updateHcfDto.route,
      executiveAssigned: updateHcfDto.executive_Assigned,
      submitBy: updateHcfDto.submitBy,
      agrID: updateHcfDto.agrID,
      sortOrder: updateHcfDto.sortOrder,
      isGovt: updateHcfDto.isGovt,
      isGSTExempt: updateHcfDto.isGSTExempt,
      autoGen: updateHcfDto.autoGen,
      status: updateHcfDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.hcfRepository.update(hcfId, hcf);
  }
}
