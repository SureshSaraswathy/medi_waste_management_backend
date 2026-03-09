import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../../barcode-label/domain/interfaces/barcode-label.repository.interface';
import { BarcodeLookupResponseDto } from '../dto/barcode-lookup-response.dto';
import { BarcodeNotFoundException, InvalidBarcodeFormatException } from '../../domain/exceptions/waste-collection.exceptions';
import { WasteColor } from '../../infrastructure/transaction/waste-collection.entity';

@Injectable()
export class LookupBarcodeUseCase {
  constructor(
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(barcode: string): Promise<BarcodeLookupResponseDto> {
    // Validate barcode format (should be alphanumeric, at least 5 characters)
    if (!barcode || barcode.length < 5 || !/^[A-Za-z0-9]+$/.test(barcode)) {
      throw new InvalidBarcodeFormatException(barcode);
    }

    // First, try to find barcode in barcode_labels table (for generated barcodes)
    const barcodeLabel = await this.barcodeLabelRepository.findByBarcodeValue(barcode);
    
    if (barcodeLabel) {
      // Found in barcode_labels table - use this data
      const hcf = await this.hcfRepository.findById(barcodeLabel.hcfId);
      if (!hcf) {
        throw new BarcodeNotFoundException(barcode);
      }

      const company = await this.companyRepository.findById(barcodeLabel.companyId);
      if (!company) {
        throw new BarcodeNotFoundException(barcode);
      }

      // Map color block to waste color
      const wasteColor = this.mapColorBlockToWasteColor(barcodeLabel.colorBlock);

      return {
        barcode,
        companyId: company.companyId,
        companyName: company.companyName,
        hcfId: hcf.hcfId,
        hcfCode: hcf.hcfCode,
        hcfName: hcf.hcfName,
        wasteColor,
        sequenceNumber: barcodeLabel.sequenceNumber.toString(),
      };
    }

    // If not found in barcode_labels, try legacy matching by HCF code prefix
    const hcfs = await this.hcfRepository.findAll();
    
    // Sort by code length (longest first) to match most specific code first
    const sortedHcfs = hcfs
      .map(h => ({ hcf: h, hcfCode: h.hcfCode, length: h.hcfCode.length }))
      .sort((a, b) => b.length - a.length);

    // Find the longest HCF code that matches the beginning of the barcode
    let matchedHcf = null;
    for (const hcfInfo of sortedHcfs) {
      if (barcode.startsWith(hcfInfo.hcfCode)) {
        matchedHcf = hcfInfo.hcf;
        break;
      }
    }

    if (!matchedHcf) {
      throw new BarcodeNotFoundException(barcode);
    }

    // Get company information
    const company = await this.companyRepository.findById(matchedHcf.companyId);
    if (!company) {
      throw new BarcodeNotFoundException(barcode);
    }

    // Extract sequence number from barcode
    const sequenceNumber = barcode.substring(matchedHcf.hcfCode.length);

    // Determine waste color based on barcode type or default logic
    const wasteColor = this.determineWasteColor(barcode, matchedHcf);

    return {
      barcode,
      companyId: company.companyId,
      companyName: company.companyName,
      hcfId: matchedHcf.hcfId,
      hcfCode: matchedHcf.hcfCode,
      hcfName: matchedHcf.hcfName,
      wasteColor,
      sequenceNumber,
    };
  }

  private mapColorBlockToWasteColor(colorBlock: string): WasteColor {
    switch (colorBlock) {
      case 'Yellow':
        return WasteColor.YELLOW;
      case 'Red':
        return WasteColor.RED;
      case 'White':
        return WasteColor.WHITE;
      default:
        return WasteColor.YELLOW;
    }
  }

  private determineWasteColor(barcode: string, hcf: any): WasteColor {
    // Default logic: You can enhance this based on your business rules
    // For example, check HCF type, or store color with barcode generation
    // For now, defaulting to Yellow (most common for medical waste)
    return WasteColor.YELLOW;
  }
}
