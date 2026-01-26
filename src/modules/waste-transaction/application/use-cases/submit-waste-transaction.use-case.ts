import { Injectable, Inject } from '@nestjs/common';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { WasteTransaction } from '../../domain/entities/waste-transaction.domain.entity';
import { WasteTransactionNotFoundException, InvalidStatusTransitionException } from '../../domain/exceptions/waste-transaction.exceptions';

@Injectable()
export class SubmitWasteTransactionUseCase {
  constructor(
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
  ) {}

  async execute(wasteTransactionId: string, modifiedBy?: string): Promise<WasteTransaction> {
    const transaction = await this.wasteTransactionRepository.findById(wasteTransactionId);
    if (!transaction) {
      throw new WasteTransactionNotFoundException(wasteTransactionId);
    }

    try {
      const submitted = transaction.submit(modifiedBy || null);
      return this.wasteTransactionRepository.update(submitted);
    } catch (error) {
      throw new InvalidStatusTransitionException(transaction.status, 'submit');
    }
  }
}
