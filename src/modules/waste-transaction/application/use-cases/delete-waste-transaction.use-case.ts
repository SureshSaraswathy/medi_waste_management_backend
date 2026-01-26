import { Injectable, Inject } from '@nestjs/common';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { WasteTransactionNotFoundException } from '../../domain/exceptions/waste-transaction.exceptions';

@Injectable()
export class DeleteWasteTransactionUseCase {
  constructor(
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
  ) {}

  async execute(wasteTransactionId: string): Promise<void> {
    const transaction = await this.wasteTransactionRepository.findById(wasteTransactionId);
    if (!transaction) {
      throw new WasteTransactionNotFoundException(wasteTransactionId);
    }
    await this.wasteTransactionRepository.softDelete(wasteTransactionId);
  }
}
