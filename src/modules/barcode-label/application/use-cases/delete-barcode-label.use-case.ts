import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeLabelNotFoundException } from '../../domain/exceptions/barcode-label.exceptions';

@Injectable()
export class DeleteBarcodeLabelUseCase {
  constructor(
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(barcodeLabelId: string): Promise<void> {
    const label = await this.barcodeLabelRepository.findById(barcodeLabelId);
    if (!label) {
      throw new BarcodeLabelNotFoundException(barcodeLabelId);
    }
    await this.barcodeLabelRepository.softDelete(barcodeLabelId);
  }
}
