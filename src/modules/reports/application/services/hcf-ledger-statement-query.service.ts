import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InvoiceEntity } from '../../../invoice/infrastructure/transaction/invoice.entity';
import { ReceiptEntity } from '../../../payment/infrastructure/transaction/receipt.entity';
import { ReceiptInvoiceMappingEntity } from '../../../payment/infrastructure/transaction/receipt-invoice-mapping.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';
import { HcfLedgerStatementRequestDto } from '../dto/hcf-ledger-statement-request.dto';
import {
  HcfLedgerStatementResponseDto,
  HcfLedgerStatementRowDto,
} from '../dto/hcf-ledger-statement-response.dto';

@Injectable()
export class HcfLedgerStatementQueryService {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(ReceiptEntity, 'transaction')
    private readonly receiptRepository: Repository<ReceiptEntity>,
    @InjectRepository(ReceiptInvoiceMappingEntity, 'transaction')
    private readonly receiptInvoiceMappingRepository: Repository<ReceiptInvoiceMappingEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepository: Repository<HcfEntity>,
  ) {}

  async getReport(
    filters: HcfLedgerStatementRequestDto,
  ): Promise<HcfLedgerStatementResponseDto> {
    const fromDate = (filters.fromDate || '').trim();
    const toDate = (filters.toDate || '').trim();
    const hcfId = (filters.hcfId || '').trim();

    if (!fromDate || !toDate) {
      throw new BadRequestException('From date and To date are required');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('From date cannot be later than To date');
    }

    const hcfOptions = await this.getHcfOptions();
    if (!hcfId) {
      return {
        header: {
          hcfId: '',
          hcfName: '',
          fromDate,
          toDate,
        },
        rows: [],
        totals: {
          totalDr: 0,
          totalCr: 0,
          balanceReceivable: 0,
        },
        meta: {
          totalRecords: 0,
          hcfOptions,
        },
      };
    }
    const selectedHcf = hcfOptions.find((h) => h.hcfId === hcfId);
    if (!selectedHcf) {
      throw new BadRequestException('Invalid HCF selected');
    }

    const openingDr = await this.getInvoiceSum(hcfId, undefined, fromDate, true);
    const openingCr = await this.getReceiptAllocationSum(hcfId, undefined, fromDate, true);
    const openingBalance = Number((openingDr - openingCr).toFixed(2));

    const [invoiceEntries, receiptEntries] = await Promise.all([
      this.getInvoiceEntries(hcfId, fromDate, toDate),
      this.getReceiptEntries(hcfId, fromDate, toDate),
    ]);

    const openingRow: HcfLedgerStatementRowDto = {
      date: fromDate,
      particulars: 'Opening',
      invoiceAmountDr: openingBalance,
      receiptAmountCr: null,
      rowType: 'opening',
    };

    const statementRows: HcfLedgerStatementRowDto[] = [openingRow, ...invoiceEntries, ...receiptEntries].sort((a, b) => {
      if (a.rowType === 'opening') return -1;
      if (b.rowType === 'opening') return 1;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.particulars.localeCompare(b.particulars);
    });

    const periodDr = invoiceEntries.reduce((sum, row) => sum + Number(row.invoiceAmountDr || 0), 0);
    const periodCr = receiptEntries.reduce((sum, row) => sum + Number(row.receiptAmountCr || 0), 0);

    const totalDr = Number((openingBalance + periodDr).toFixed(2));
    const totalCr = Number(periodCr.toFixed(2));
    const balanceReceivable = Number((totalDr - totalCr).toFixed(2));

    statementRows.push(
      {
        date: '',
        particulars: 'Total',
        invoiceAmountDr: totalDr,
        receiptAmountCr: totalCr,
        rowType: 'total',
      },
      {
        date: '',
        particulars: 'Balance Receivable',
        invoiceAmountDr: balanceReceivable,
        receiptAmountCr: null,
        rowType: 'balance',
      },
    );

    return {
      header: {
        hcfId,
        hcfName: selectedHcf.hcfName,
        fromDate,
        toDate,
      },
      rows: statementRows,
      totals: {
        totalDr,
        totalCr,
        balanceReceivable,
      },
      meta: {
        totalRecords: statementRows.length,
        hcfOptions,
      },
    };
  }

  private async getHcfOptions(): Promise<Array<{ hcfId: string; hcfName: string }>> {
    const hcfs = await this.hcfRepository.find({
      where: { isDeleted: false },
      order: { hcfName: 'ASC' },
    });
    return hcfs.map((h) => ({ hcfId: h.hcfId, hcfName: h.hcfShortName || h.hcfName }));
  }

  private async getInvoiceSum(
    hcfId: string,
    fromDate?: string,
    toDate?: string,
    strictToExclusive = false,
  ): Promise<number> {
    const qb = this.invoiceRepository
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.invoice_value), 0)', 'sum')
      .where('i.is_deleted = false')
      .andWhere('i.hcf_id = :hcfId', { hcfId });

    if (fromDate) qb.andWhere('i.invoice_date >= :fromDate', { fromDate });
    if (toDate) {
      qb.andWhere(
        strictToExclusive ? 'i.invoice_date < :toDate' : 'i.invoice_date <= :toDate',
        { toDate },
      );
    }
    const raw = await qb.getRawOne<{ sum: string }>();
    return Number(raw?.sum || 0);
  }

  private async getReceiptAllocationSum(
    hcfId: string,
    fromDate?: string,
    toDate?: string,
    strictToExclusive = false,
  ): Promise<number> {
    const invoiceIds = (
      await this.invoiceRepository.find({
        where: { hcfId, isDeleted: false },
        select: { invoiceId: true },
      })
    ).map((i) => i.invoiceId);

    if (!invoiceIds.length) return 0;

    const qb = this.receiptInvoiceMappingRepository
      .createQueryBuilder('rim')
      .innerJoin(ReceiptEntity, 'r', 'r.receipt_id = rim.receipt_id AND r.is_deleted = false')
      .select('COALESCE(SUM(rim.allocated_amount), 0)', 'sum')
      .where('rim.is_deleted = false')
      .andWhere('rim.invoice_id IN (:...invoiceIds)', { invoiceIds });

    if (fromDate) qb.andWhere('r.receipt_date >= :fromDate', { fromDate });
    if (toDate) {
      qb.andWhere(
        strictToExclusive ? 'r.receipt_date < :toDate' : 'r.receipt_date <= :toDate',
        { toDate },
      );
    }
    const raw = await qb.getRawOne<{ sum: string }>();
    return Number(raw?.sum || 0);
  }

  private async getInvoiceEntries(
    hcfId: string,
    fromDate: string,
    toDate: string,
  ): Promise<HcfLedgerStatementRowDto[]> {
    const invoices = await this.invoiceRepository.find({
      where: {
        hcfId,
        isDeleted: false,
      },
      order: { invoiceDate: 'ASC' },
    });
    return invoices
      .filter((inv) => {
        const d = this.toDate(inv.invoiceDate);
        return d >= fromDate && d <= toDate;
      })
      .map((inv) => ({
        date: this.toDate(inv.invoiceDate),
        particulars: `Invoice Num: ${inv.invoiceNumber}`,
        invoiceAmountDr: Number(Number(inv.invoiceValue || 0).toFixed(2)),
        receiptAmountCr: null,
        rowType: 'invoice' as const,
      }));
  }

  private async getReceiptEntries(
    hcfId: string,
    fromDate: string,
    toDate: string,
  ): Promise<HcfLedgerStatementRowDto[]> {
    const invoices = await this.invoiceRepository.find({
      where: { hcfId, isDeleted: false },
      select: { invoiceId: true },
    });
    const invoiceIds = invoices.map((i) => i.invoiceId);
    if (!invoiceIds.length) return [];

    const mappings = await this.receiptInvoiceMappingRepository.find({
      where: { invoiceId: In(invoiceIds), isDeleted: false },
      select: { receiptId: true, allocatedAmount: true },
    });
    if (!mappings.length) return [];

    const receiptIds = [...new Set(mappings.map((m) => m.receiptId))];
    const receipts = await this.receiptRepository.find({
      where: receiptIds.map((receiptId) => ({ receiptId, isDeleted: false })),
      order: { receiptDate: 'ASC' },
    });
    const receiptMap = new Map(receipts.map((r) => [r.receiptId, r]));

    const grouped = new Map<string, number>();
    for (const map of mappings) {
      const rec = receiptMap.get(map.receiptId);
      if (!rec) continue;
      const rd = this.toDate(rec.receiptDate);
      if (rd < fromDate || rd > toDate) continue;
      grouped.set(map.receiptId, Number((grouped.get(map.receiptId) || 0) + Number(map.allocatedAmount || 0)));
    }

    return Array.from(grouped.entries()).map(([receiptId, amount]) => {
      const rec = receiptMap.get(receiptId);
      const receiptNumber = rec?.receiptNumber || receiptId;
      const date = rec ? this.toDate(rec.receiptDate) : '';
      return {
        date,
        particulars: `Receipt ${receiptNumber}`,
        invoiceAmountDr: null,
        receiptAmountCr: Number(amount.toFixed(2)),
        rowType: 'receipt' as const,
      };
    });
  }

  private toDate(value: Date | string): string {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }
}

