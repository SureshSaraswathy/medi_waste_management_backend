import { Injectable, Inject } from '@nestjs/common';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { WasteTransaction } from '../../domain/entities/waste-transaction.domain.entity';
import { TransactionStatus } from '../../infrastructure/transaction/waste-transaction.entity';

@Injectable()
export class GetAllWasteTransactionsUseCase {
  constructor(
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
  ) {}

  async execute(
    companyId?: string,
    hcfId?: string,
    startDate?: string,
    endDate?: string,
    status?: string,
  ): Promise<WasteTransaction[]> {
    let results: WasteTransaction[];

    // Start with base query based on filters
    if (startDate && endDate) {
      results = await this.wasteTransactionRepository.findByDateRange(
        new Date(startDate),
        new Date(endDate),
      );
    } else if (companyId) {
      results = await this.wasteTransactionRepository.findByCompany(companyId);
    } else if (hcfId) {
      results = await this.wasteTransactionRepository.findByHcf(hcfId);
    } else {
      results = await this.wasteTransactionRepository.findAll();
    }

    // Apply status filter if provided (client-side filtering for now)
    // TODO: Optimize by adding combined repository methods if needed
    if (status) {
      results = results.filter(t => t.status === (status as TransactionStatus));
    }

    return results;
  }
}
