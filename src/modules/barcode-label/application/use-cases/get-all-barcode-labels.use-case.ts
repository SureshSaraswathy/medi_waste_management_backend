import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeLabel } from '../../domain/entities/barcode-label.domain.entity';

@Injectable()
export class GetAllBarcodeLabelsUseCase {
  constructor(
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(
    companyId?: string,
    hcfId?: string,
    hcfCode?: string,
    barcodeType?: string,
  ): Promise<BarcodeLabel[]> {
    if (hcfCode && barcodeType) {
      return this.barcodeLabelRepository.findByHcfCodeAndType(
        hcfCode,
        barcodeType as any,
      );
    }

    if (hcfId) {
      return this.barcodeLabelRepository.findByHcf(hcfId);
    }

    if (companyId) {
      return this.barcodeLabelRepository.findByCompany(companyId);
    }

    return this.barcodeLabelRepository.findAll();
  }
}
