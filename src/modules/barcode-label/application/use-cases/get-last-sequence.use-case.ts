import { Injectable, Inject } from '@nestjs/common';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeType } from '../../infrastructure/transaction/barcode-label.entity';

@Injectable()
export class GetLastSequenceUseCase {
  constructor(
    @Inject(BARCODE_LABEL_REPOSITORY_TOKEN)
    private readonly barcodeLabelRepository: IBarcodeLabelRepository,
  ) {}

  async execute(): Promise<number> {
    return this.barcodeLabelRepository.getLastSequenceNumber();
  }
}
