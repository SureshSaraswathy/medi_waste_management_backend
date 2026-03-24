import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WasteTransactionEntity } from '../../../waste-transaction/infrastructure/transaction/waste-transaction.entity';
import { VehicleWasteCollectionEntity } from '../../../vehicle-waste-collection/infrastructure/transaction/vehicle-waste-collection.entity';
import { OperatorPcbReportRequestDto } from '../dto/operator-pcb-report-request.dto';
import { OperatorPcbReportResponseDto, OperatorPcbReportRowDto } from '../dto/operator-pcb-report-response.dto';

@Injectable()
export class OperatorPcbReportQueryService {
  constructor(
    @InjectRepository(WasteTransactionEntity, 'transaction')
    private readonly wasteTransactionRepository: Repository<WasteTransactionEntity>,
    @InjectRepository(VehicleWasteCollectionEntity, 'transaction')
    private readonly vehicleWasteCollectionRepository: Repository<VehicleWasteCollectionEntity>,
  ) {}

  async getReport(filters: OperatorPcbReportRequestDto): Promise<OperatorPcbReportResponseDto> {
    const fromDate = (filters.fromDate || '').trim();
    const toDate = (filters.toDate || '').trim();
    const option = (filters.option || 'Operator PCB Report').trim();

    if (!fromDate || !toDate) {
      throw new BadRequestException('From date and To date are required');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('From date cannot be later than To date');
    }

    const collectedRaw = await this.wasteTransactionRepository
      .createQueryBuilder('wt')
      .select("TO_CHAR(wt.pickup_date, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(DISTINCT wt.hcf_id)', 'noOfHce')
      .addSelect('COALESCE(SUM(wt.yellow_weight_kg), 0)', 'collectedYellowKg')
      .addSelect('COALESCE(SUM(wt.red_weight_kg + wt.white_weight_kg + wt.blue_weight_kg), 0)', 'collectedRwbKg')
      .where('wt.is_deleted = false')
      .andWhere('wt.pickup_date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
      .groupBy('wt.pickup_date')
      .orderBy('wt.pickup_date', 'ASC')
      .getRawMany();

    const treatedRaw = await this.vehicleWasteCollectionRepository
      .createQueryBuilder('vwc')
      .select("TO_CHAR(vwc.collection_date, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(vwc.incineration_weight_kg), 0)', 'treatedYellowKg')
      .addSelect('COALESCE(SUM(vwc.autoclave_weight_kg), 0)', 'treatedRwbKg')
      .where('vwc.is_deleted = false')
      .andWhere('vwc.collection_date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
      .groupBy('vwc.collection_date')
      .orderBy('vwc.collection_date', 'ASC')
      .getRawMany();

    const treatedByDate = new Map(
      treatedRaw.map((r) => [
        r.date,
        {
          treatedYellowKg: Number(r.treatedYellowKg || 0),
          treatedRwbKg: Number(r.treatedRwbKg || 0),
        },
      ]),
    );

    const data: OperatorPcbReportRowDto[] = collectedRaw.map((r) => {
      const treated = treatedByDate.get(r.date) || { treatedYellowKg: 0, treatedRwbKg: 0 };
      return {
        date: r.date,
        noOfHce: Number(r.noOfHce || 0),
        collectedYellowKg: Number(Number(r.collectedYellowKg || 0).toFixed(2)),
        collectedRwbKg: Number(Number(r.collectedRwbKg || 0).toFixed(2)),
        treatedYellowKg: Number(Number(treated.treatedYellowKg || 0).toFixed(2)),
        treatedRwbKg: Number(Number(treated.treatedRwbKg || 0).toFixed(2)),
      };
    });

    const totals = {
      totalHce: data.reduce((s, r) => s + r.noOfHce, 0),
      totalCollectedYellowKg: Number(data.reduce((s, r) => s + r.collectedYellowKg, 0).toFixed(2)),
      totalCollectedRwbKg: Number(data.reduce((s, r) => s + r.collectedRwbKg, 0).toFixed(2)),
      totalTreatedYellowKg: Number(data.reduce((s, r) => s + r.treatedYellowKg, 0).toFixed(2)),
      totalTreatedRwbKg: Number(data.reduce((s, r) => s + r.treatedRwbKg, 0).toFixed(2)),
    };

    return {
      header: { fromDate, toDate, option },
      data,
      totals,
    };
  }
}

