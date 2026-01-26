import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeLabel } from '../../domain/entities/barcode-label.domain.entity';
import { BarcodeLabelNotFoundException } from '../../domain/exceptions/barcode-label.exceptions';

@Injectable()
export class GetBarcodeLabelUseCase {
  constructor(
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(barcodeLabelId: string): Promise<BarcodeLabel> {
    const label = await this.barcodeLabelRepository.findById(barcodeLabelId);
    if (!label) {
      throw new BarcodeLabelNotFoundException(barcodeLabelId);
    }
    return label;
  }
}
