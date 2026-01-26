import { Injectable, Inject } from '@nestjs/common';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
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
  ) {}

  async execute(barcode: string): Promise<BarcodeLookupResponseDto> {
    // Validate barcode format (should be alphanumeric, at least 5 characters)
    if (!barcode || barcode.length < 5 || !/^[A-Za-z0-9]+$/.test(barcode)) {
      throw new InvalidBarcodeFormatException(barcode);
    }

    // Get all HCFs to find matching code
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
    // For now, we'll use a default or allow it to be set during collection
    // In a real system, color might be stored with the barcode or determined by HCF type
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

  private determineWasteColor(barcode: string, hcf: any): WasteColor {
    // Default logic: You can enhance this based on your business rules
    // For example, check HCF type, or store color with barcode generation
    // For now, defaulting to Yellow (most common for medical waste)
    return WasteColor.YELLOW;
  }
}
