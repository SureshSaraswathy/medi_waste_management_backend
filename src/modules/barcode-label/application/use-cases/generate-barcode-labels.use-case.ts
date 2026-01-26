import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { BarcodeLabel } from '../../domain/entities/barcode-label.domain.entity';
import { CreateBarcodeLabelDto } from '../dto/create-barcode-label.dto';
import { DuplicateBarcodeValueException, InvalidHcfException, InvalidCompanyException } from '../../domain/exceptions/barcode-label.exceptions';
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

    // Get last sequence number for this HCF and barcode type
    const lastSequence = await this.barcodeLabelRepository.getLastSequenceNumber(
      hcf.hcfCode,
      createBarcodeLabelDto.barcodeType,
    );

    // Generate labels
    const newLabels: BarcodeLabel[] = [];
    for (let i = 0; i < createBarcodeLabelDto.count; i++) {
      const sequenceNumber = lastSequence + i + 1;
      const barcodeValue = this.generateBarcodeValue(hcf.hcfCode, sequenceNumber);

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
        createdBy: createdBy || null,
      });

      newLabels.push(label);
    }

    // Save all labels
    return this.barcodeLabelRepository.createMany(newLabels);
  }

  private generateBarcodeValue(hcfCode: string, sequence: number): string {
    const sequenceStr = sequence.toString().padStart(15 - hcfCode.length, '0');
    return `${hcfCode}${sequenceStr}`;
  }
}
