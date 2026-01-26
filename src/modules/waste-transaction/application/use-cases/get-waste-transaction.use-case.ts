import { Injectable, Inject } from '@nestjs/common';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { WasteTransaction } from '../../domain/entities/waste-transaction.domain.entity';
import { WasteTransactionNotFoundException } from '../../domain/exceptions/waste-transaction.exceptions';

@Injectable()
export class GetWasteTransactionUseCase {
  constructor(
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
  ) {}

  async execute(wasteTransactionId: string): Promise<WasteTransaction> {
    const transaction = await this.wasteTransactionRepository.findById(wasteTransactionId);
    if (!transaction) {
      throw new WasteTransactionNotFoundException(wasteTransactionId);
    }
    return transaction;
  }
}
