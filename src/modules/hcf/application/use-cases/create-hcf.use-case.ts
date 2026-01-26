import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { Hcf } from '../../domain/entities/hcf.domain.entity';
import { CreateHcfDto } from '../dto/create-hcf.dto';
import { DuplicateHcfCodeException } from '../../domain/exceptions/hcf.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateHcfUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
  ) {}

  async execute(createHcfDto: CreateHcfDto, createdBy?: string): Promise<Hcf> {
    const existing = await this.hcfRepository.findByHcfCode(
      createHcfDto.hcfCode,
      createHcfDto.companyId,
    );
    if (existing) {
      throw new DuplicateHcfCodeException(createHcfDto.hcfCode);
    }

    const hcf = Hcf.create({
      hcfId: randomUUID(),
      hcfCode: createHcfDto.hcfCode,
      companyId: createHcfDto.companyId,
      password: createHcfDto.password,
      hcfTypeCode: createHcfDto.hcfTypeCode,
      hcfName: createHcfDto.hcfName,
      hcfShortName: createHcfDto.hcfShortName,
      areaId: createHcfDto.areaId,
      pincode: createHcfDto.pincode,
      district: createHcfDto.district,
      stateCode: createHcfDto.stateCode,
      groupCode: createHcfDto.groupCode,
      pcbZone: createHcfDto.pcbZone,
      billingName: createHcfDto.billingName,
      billingAddress: createHcfDto.billingAddress,
      serviceAddress: createHcfDto.serviceAddress,
      gstin: createHcfDto.gstin,
      regnNum: createHcfDto.regnNum,
      hospRegnDate: createHcfDto.hospRegnDate,
      billingType: createHcfDto.billingType,
      advAmount: createHcfDto.advAmount,
      billingOption: createHcfDto.billingOption,
      bedCount: createHcfDto.bedCount,
      bedRate: createHcfDto.bedRate,
      kgRate: createHcfDto.kgRate,
      lumpsum: createHcfDto.lumpsum,
      accountsLandline: createHcfDto.accountsLandline,
      accountsMobile: createHcfDto.accountsMobile,
      accountsEmail: createHcfDto.accountsEmail,
      contactName: createHcfDto.contactName,
      contactDesignation: createHcfDto.contactDesignation,
      contactMobile: createHcfDto.contactMobile,
      contactEmail: createHcfDto.contactEmail,
      agrSignAuthName: createHcfDto.agrSignAuthName,
      agrSignAuthDesignation: createHcfDto.agrSignAuthDesignation,
      drName: createHcfDto.drName,
      drPhNo: createHcfDto.drPhNo,
      drEmail: createHcfDto.drEmail,
      serviceStartDate: createHcfDto.serviceStartDate,
      serviceEndDate: createHcfDto.serviceEndDate,
      category: createHcfDto.category,
      route: createHcfDto.route,
      executiveAssigned: createHcfDto.executive_Assigned,
      submitBy: createHcfDto.submitBy,
      agrID: createHcfDto.agrID,
      sortOrder: createHcfDto.sortOrder,
      isGovt: createHcfDto.isGovt,
      isGSTExempt: createHcfDto.isGSTExempt,
      autoGen: createHcfDto.autoGen,
      createdBy: createdBy || null,
    });

    return this.hcfRepository.create(hcf);
  }
}
