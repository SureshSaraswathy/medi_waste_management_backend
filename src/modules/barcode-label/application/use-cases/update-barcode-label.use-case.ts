import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeLabelNotFoundException } from '../../domain/exceptions/barcode-label.exceptions';
import { ColorBlock, BarcodeStatus } from '../../infrastructure/transaction/barcode-label.entity';

export interface UpdateBarcodeLabelDto {
  colorBlock?: ColorBlock;
  status?: BarcodeStatus;
}

@Injectable()
export class UpdateBarcodeLabelUseCase {
  constructor(
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(barcodeLabelId: string, updateDto: UpdateBarcodeLabelDto, modifiedBy?: string): Promise<any> {
    const label = await this.barcodeLabelRepository.findById(barcodeLabelId);
    if (!label) {
      throw new BarcodeLabelNotFoundException(barcodeLabelId);
    }

    if (updateDto.colorBlock !== undefined) {
      label.updateColorBlock(updateDto.colorBlock, modifiedBy || null);
    }

    if (updateDto.status !== undefined) {
      label.updateStatus(updateDto.status, modifiedBy || null);
    }

    return this.barcodeLabelRepository.update(label);
  }
}
