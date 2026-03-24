import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WasteTransactionEntity } from '../../../waste-transaction/infrastructure/transaction/waste-transaction.entity';
import { HcfWasteCollectionHistoryRequestDto } from '../dto/hcf-waste-collection-history-request.dto';
import {
  HcfWasteCollectionHistoryItemDto,
  HcfWasteCollectionHistoryResponseDto,
} from '../dto/hcf-waste-collection-history-response.dto';

@Injectable()
export class HcfWasteCollectionHistoryQueryService {
  constructor(
    @InjectRepository(WasteTransactionEntity, 'transaction')
    private readonly wasteTransactionRepository: Repository<WasteTransactionEntity>,
  ) {}

  async getReport(
    filters: HcfWasteCollectionHistoryRequestDto,
  ): Promise<HcfWasteCollectionHistoryResponseDto> {
    const qb = this.wasteTransactionRepository
      .createQueryBuilder('wt')
      .where('wt.is_deleted = false');

    if (filters.hcfId?.trim()) {
      qb.andWhere('wt.hcf_id = :hcfId', { hcfId: filters.hcfId.trim() });
    }
    if (filters.fromDate?.trim()) {
      qb.andWhere('wt.pickup_date >= :fromDate', { fromDate: filters.fromDate.trim() });
    }
    if (filters.toDate?.trim()) {
      qb.andWhere('wt.pickup_date <= :toDate', { toDate: filters.toDate.trim() });
    }

    qb.orderBy('wt.pickup_date', 'DESC').addOrderBy('wt.created_on', 'DESC');

    const rows = await qb.getMany();

    const data: HcfWasteCollectionHistoryItemDto[] = rows.map((r, index) => {
      const yellowWeight = Number(r.yellowWeightKg || 0);
      const redWeight = Number(r.redWeightKg || 0);
      const blueWeight = Number(r.blueWeightKg || 0);
      const whiteWeight = Number(r.whiteWeightKg || 0);
      const totalWeight = yellowWeight + redWeight + blueWeight + whiteWeight;

      return {
        serialNo: index + 1,
        date: this.toDateString(r.pickupDate),
        latLong:
          r.latitude != null && r.longitude != null
            ? `${Number(r.latitude).toFixed(6)}, ${Number(r.longitude).toFixed(6)}`
            : '-',
        inTime: this.toTimeString(r.createdOn),
        outTime: this.toTimeString(r.modifiedOn || r.createdOn),
        yellowBagCount: Number(r.yellowBagCount || 0),
        yellowWeight,
        redBagCount: Number(r.redBagCount || 0),
        redWeight,
        blueBagCount: Number(r.blueBagCount || 0),
        blueWeight,
        whiteBagCount: Number(r.whiteBagCount || 0),
        whiteWeight,
        totalWeight,
        remarks: r.notes || '-',
      };
    });

    return { data };
  }

  private toDateString(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toISOString().slice(0, 10);
  }

  private toTimeString(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toISOString().slice(11, 16);
  }
}

