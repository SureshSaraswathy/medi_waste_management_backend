import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { BarcodeLabel } from '../../domain/entities/barcode-label.domain.entity';
import { CreateBarcodeLabelDto } from '../dto/create-barcode-label.dto';
import { DuplicateBarcodeValueException, InvalidHcfException, InvalidCompanyException } from '../../domain/exceptions/barcode-label.exceptions';
import { BarcodeType, BarcodeStatus } from '../../infrastructure/transaction/barcode-label.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class GenerateBarcodeLabelsUseCase {
  constructor(
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(createBarcodeLabelDto: CreateBarcodeLabelDto, createdBy?: string): Promise<BarcodeLabel[]> {
    // Validate HCF exists
    const hcf = await this.hcfRepository.findById(createBarcodeLabelDto.hcfId);
    if (!hcf) {
      throw new InvalidHcfException(createBarcodeLabelDto.hcfId);
    }

    // Validate Company exists
    const company = await this.companyRepository.findById(createBarcodeLabelDto.companyId);
    if (!company) {
      throw new InvalidCompanyException(createBarcodeLabelDto.companyId);
    }

    // Get last global sequence number (not dependent on HCF or color)
    const lastSequence = await this.barcodeLabelRepository.getLastSequenceNumber();

    // Generate HCFUniqueID for QR Code type
    const hcfUniqueId = this.generateHCFUniqueID(hcf);

    // Generate labels
    const newLabels: BarcodeLabel[] = [];
    for (let i = 0; i < createBarcodeLabelDto.count; i++) {
      const sequenceNumber = lastSequence + i + 1;
      const barcodeValue = this.generateBarcodeValue(
        hcf,
        sequenceNumber,
        createBarcodeLabelDto.barcodeType,
        hcfUniqueId,
      );

      // Check for duplicate barcode value
      const existing = await this.barcodeLabelRepository.findByBarcodeValue(barcodeValue);
      if (existing) {
        throw new DuplicateBarcodeValueException(barcodeValue);
      }

      const label = BarcodeLabel.create({
        barcodeLabelId: randomUUID(),
        hcfCode: hcf.hcfCode,
        hcfId: hcf.hcfId,
        companyId: company.companyId,
        sequenceNumber,
        barcodeValue,
        barcodeType: createBarcodeLabelDto.barcodeType,
        colorBlock: createBarcodeLabelDto.colorBlock,
        status: BarcodeStatus.ACTIVE,
        createdBy: createdBy || null,
      });

      newLabels.push(label);
    }

    // Save all labels
    return this.barcodeLabelRepository.createMany(newLabels);
  }

  /**
   * Generate HCFUniqueID: First 5 chars HCF Code + Pincode + State Code + HCF Type + Last 5 chars HCF Code
   */
  private generateHCFUniqueID(hcf: any): string {
    const hcfCode = hcf.hcfCode || '';
    const pincode = hcf.pincode || '';
    const stateCode = hcf.stateCode || '';
    const hcfType = hcf.hcfTypeCode || '';
    
    const first5Chars = hcfCode.substring(0, 5).padEnd(5, '0');
    const last5Chars = hcfCode.length >= 5 
      ? hcfCode.substring(hcfCode.length - 5)
      : hcfCode.padStart(5, '0');
    
    return `${first5Chars}${pincode}${stateCode}${hcfType}${last5Chars}`;
  }

  /**
   * Generate barcode value:
   * - For Barcode type: 13-digit numeric code only (no prefix)
   * - For QR Code type: HCFUniqueID
   */
  private generateBarcodeValue(
    hcf: any,
    sequence: number,
    barcodeType: BarcodeType,
    hcfUniqueId: string,
  ): string {
    if (barcodeType === BarcodeType.BARCODE) {
      // Barcode: 13-digit numeric code only
      return sequence.toString().padStart(13, '0');
    } else {
      // QR Code: Use HCFUniqueID
      return hcfUniqueId;
    }
  }
}
