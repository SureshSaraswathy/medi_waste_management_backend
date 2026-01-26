import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FinBalance } from '../../domain/entities/fin-balance.domain.entity';
import { IFinBalanceRepository, FIN_BALANCE_REPOSITORY_TOKEN } from '../../domain/interfaces/fin-balance.repository.interface';
import { CreateFinBalanceDto } from '../dto/create-fin-balance.dto';
import { BulkUploadPreviewDto } from '../dto/bulk-upload-fin-balance.dto';

@Injectable()
export class BulkUploadFinBalanceUseCase {
  constructor(
    @Inject(FIN_BALANCE_REPOSITORY_TOKEN)
    private readonly finBalanceRepository: IFinBalanceRepository,
  ) {}

  /**
   * Preview bulk upload - identifies inserts and updates
   */
  async preview(
    records: CreateFinBalanceDto[],
  ): Promise<BulkUploadPreviewDto> {
    const inserts: CreateFinBalanceDto[] = [];
    const updates: Array<{ finBalanceId: string; data: CreateFinBalanceDto }> = [];
    const errors: Array<{ row: number; message: string; data: any }> = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;

      try {
        // Check if balance exists for this company-HCF combination
        const existing = await this.finBalanceRepository.findByCompanyAndHcf(
          record.companyId,
          record.hcfId
        );

        if (existing) {
          updates.push({
            finBalanceId: existing.finBalanceId,
            data: record,
          });
        } else {
          inserts.push(record);
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: record,
        });
      }
    }

    return { inserts, updates, errors };
  }

  /**
   * Execute bulk upload - creates new records and updates existing ones
   */
  async execute(
    preview: BulkUploadPreviewDto,
    createdBy?: string,
  ): Promise<{ created: FinBalance[]; updated: FinBalance[] }> {
    const created: FinBalance[] = [];
    const updated: FinBalance[] = [];

    // Create new records
    if (preview.inserts.length > 0) {
      const newBalances = preview.inserts.map(record =>
        FinBalance.create({
          finBalanceId: randomUUID(),
          companyId: record.companyId,
          hcfId: record.hcfId,
          openingBalance: record.openingBalance,
          currentBalance: record.currentBalance ?? record.openingBalance,
          isManual: true,
          notes: record.notes ?? null,
          createdBy,
        })
      );
      const saved = await this.finBalanceRepository.bulkCreate(newBalances);
      created.push(...saved);
    }

    // Update existing records
    if (preview.updates.length > 0) {
      const updatePromises = preview.updates.map(async ({ finBalanceId, data }) => {
        const existing = await this.finBalanceRepository.findById(finBalanceId);
        if (existing) {
          existing.updateOpeningBalance(data.openingBalance, createdBy);
          if (data.notes !== undefined) {
            existing.notes = data.notes;
          }
          return await this.finBalanceRepository.update(existing);
        }
        return null;
      });

      const updatedResults = await Promise.all(updatePromises);
      updated.push(...updatedResults.filter((r): r is FinBalance => r !== null));
    }

    return { created, updated };
  }
}
