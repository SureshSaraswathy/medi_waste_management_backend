import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf.repository.interface';
import { Hcf } from '../../domain/entities/hcf.domain.entity';
import { CreateHcfDto } from '../dto/create-hcf.dto';
import { DuplicateHcfCodeException } from '../../domain/exceptions/hcf.exceptions';
import { PasswordService } from '../../../user/application/services/password.service';
import { EmailService } from '../../../auth/services/email.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateHcfUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  async execute(createHcfDto: CreateHcfDto, createdBy?: string): Promise<Hcf> {
    const existing = await this.hcfRepository.findByHcfCode(
      createHcfDto.hcfCode,
      createHcfDto.companyId,
    );
    if (existing) {
      throw new DuplicateHcfCodeException(createHcfDto.hcfCode);
    }

    // Handle login creation if loginEnabled is true
    let passwordHash: string | null = null;
    let temporaryPassword: string | null = null;
    let temporaryPasswordExpiry: Date | null = null;
    let forcePasswordChange = false;
    let passwordChangedAt: Date | null = null;
    let passwordExpiresAt: Date | null = null;

    if (createHcfDto.loginEnabled) {
      console.log(`[CreateHCF] Login enabled for HCF: ${createHcfDto.hcfCode}`);
      
      if (createHcfDto.password) {
        // Hash provided password
        console.log(`[CreateHCF] Password provided, hashing...`);
        passwordHash = await this.passwordService.hashPassword(createHcfDto.password);
        passwordChangedAt = new Date();
        // Set password expiry to 90 days from now
        passwordExpiresAt = new Date();
        passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);
        console.log(`[CreateHCF] Password hashed successfully, expiry set to: ${passwordExpiresAt.toISOString()}`);
      } else {
        // Generate temporary password
        console.log(`[CreateHCF] No password provided, generating temporary password...`);
        temporaryPassword = this.passwordService.generateTemporaryPassword();
        passwordHash = await this.passwordService.hashPassword(temporaryPassword);
        temporaryPasswordExpiry = this.passwordService.getTemporaryPasswordExpiry();
        forcePasswordChange = true;
        console.log(`[CreateHCF] Temporary password generated: ${temporaryPassword.substring(0, 4)}****`);
      }

      // Warn if email is not provided (but don't fail)
      if (!createHcfDto.contactEmail && !createHcfDto.accountsEmail) {
        console.warn(`[CreateHCF] WARNING: No email address provided for HCF ${createHcfDto.hcfCode}. Email notifications will not be sent.`);
      }
    } else {
      console.log(`[CreateHCF] Login NOT enabled for HCF: ${createHcfDto.hcfCode}`);
    }

    const hcf = Hcf.create({
      hcfId: randomUUID(),
      hcfCode: createHcfDto.hcfCode,
      companyId: createHcfDto.companyId,
      password: null, // Don't store plain password when login is enabled
      loginEnabled: createHcfDto.loginEnabled ?? false,
      passwordHash,
      forcePasswordChange,
      temporaryPassword,
      temporaryPasswordExpiry,
      passwordChangedAt,
      passwordExpiresAt,
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

    console.log(`[CreateHCF] Creating HCF with loginEnabled: ${hcf.loginEnabled}, passwordHash: ${hcf.passwordHash ? 'SET' : 'NULL'}`);

    // Validation: If loginEnabled is true, passwordHash must be set
    if (hcf.loginEnabled && !hcf.passwordHash) {
      console.error(`[CreateHCF] ERROR: loginEnabled is true but passwordHash is NULL for HCF: ${createHcfDto.hcfCode}`);
      throw new Error('Password hash is required when login is enabled. Please provide a password or allow system to generate a temporary password.');
    }

    const savedHcf = await this.hcfRepository.create(hcf);

    console.log(`[CreateHCF] HCF created successfully. ID: ${savedHcf.hcfId}, loginEnabled: ${savedHcf.loginEnabled}, passwordHash: ${savedHcf.passwordHash ? 'SET' : 'NULL'}`);
    
    // Verify passwordHash was saved correctly
    if (savedHcf.loginEnabled && !savedHcf.passwordHash) {
      console.error(`[CreateHCF] WARNING: HCF created with loginEnabled=true but passwordHash is NULL in saved entity!`);
    }

    // Send credentials email if login is enabled and temporary password was generated
    if (createHcfDto.loginEnabled && temporaryPassword && savedHcf.contactEmail) {
      try {
        await this.emailService.sendHCFPasswordReset({
          email: savedHcf.contactEmail,
          hcfCode: savedHcf.hcfCode,
          hcfName: savedHcf.hcfName,
          temporaryPassword,
          expiryHours: 24,
        });
        console.log(`[CreateHCF] Credentials email sent to: ${savedHcf.contactEmail}`);
      } catch (error) {
        // Log error but don't fail the operation
        console.warn('Failed to send HCF credentials email:', error);
      }
    } else if (createHcfDto.loginEnabled && temporaryPassword && !savedHcf.contactEmail) {
      console.warn(`[CreateHCF] Temporary password generated but no email address. Password: ${temporaryPassword}`);
    }

    return savedHcf;
  }
}
