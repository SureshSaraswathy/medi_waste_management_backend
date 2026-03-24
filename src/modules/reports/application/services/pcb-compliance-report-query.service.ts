import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WasteTransactionEntity } from '../../../waste-transaction/infrastructure/transaction/waste-transaction.entity';
import { WasteCollectionEntity } from '../../../waste-collection/infrastructure/transaction/waste-collection.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';
import { AreaEntity } from '../../../area/infrastructure/persistence/area.entity';
import { HcfTypeEntity } from '../../../hcf-type/infrastructure/persistence/hcf-type.entity';
import { PcbComplianceReportRequestDto } from '../dto/pcb-compliance-report-request.dto';
import { PcbComplianceReportItemDto, PcbComplianceReportResponseDto } from '../dto/pcb-compliance-report-response.dto';

@Injectable()
export class PcbComplianceReportQueryService {
  constructor(
    @InjectRepository(WasteTransactionEntity, 'transaction')
    private readonly wasteTransactionRepository: Repository<WasteTransactionEntity>,
    @InjectRepository(WasteCollectionEntity, 'transaction')
    private readonly wasteCollectionRepository: Repository<WasteCollectionEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepository: Repository<HcfEntity>,
    @InjectRepository(AreaEntity, 'master')
    private readonly areaRepository: Repository<AreaEntity>,
    @InjectRepository(HcfTypeEntity, 'master')
    private readonly hcfTypeRepository: Repository<HcfTypeEntity>,
  ) {}

  async getReport(filters: PcbComplianceReportRequestDto): Promise<PcbComplianceReportResponseDto> {
    const fromDate = (filters.fromDate || '').trim();
    const toDate = (filters.toDate || '').trim();
    if (!fromDate || !toDate) throw new BadRequestException('From date and To date are required');
    if (fromDate > toDate) throw new BadRequestException('From date cannot be later than To date');

    const generatedRows = await this.wasteTransactionRepository
      .createQueryBuilder('wt')
      .select('wt.hcf_id', 'hcfId')
      .addSelect("TO_CHAR(MAX(wt.pickup_date), 'YYYY-MM-DD')", 'generatedDate')
      .addSelect("TO_CHAR(MAX(wt.created_on), 'HH24:MI')", 'generatedTime')
      .addSelect('COALESCE(SUM(wt.yellow_bag_count),0)', 'generatedYellowCount')
      .addSelect('COALESCE(SUM(wt.yellow_weight_kg),0)', 'generatedYellowQtyKg')
      .addSelect('COALESCE(SUM(wt.red_bag_count),0)', 'generatedRedCount')
      .addSelect('COALESCE(SUM(wt.red_weight_kg),0)', 'generatedRedQtyKg')
      .addSelect('COALESCE(SUM(wt.blue_bag_count),0)', 'generatedBlueCount')
      .addSelect('COALESCE(SUM(wt.blue_weight_kg),0)', 'generatedBlueQtyKg')
      .addSelect('COALESCE(SUM(wt.white_bag_count),0)', 'generatedWhiteCount')
      .addSelect('COALESCE(SUM(wt.white_weight_kg),0)', 'generatedWhiteQtyKg')
      .where('wt.is_deleted = false')
      .andWhere('wt.pickup_date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
      .groupBy('wt.hcf_id')
      .getRawMany();

    const hcfIds = generatedRows.map((r) => r.hcfId).filter(Boolean);
    if (!hcfIds.length) {
      return {
        header: { fromDate, toDate },
        data: [],
        totals: {
          totalGeneratedYellowQtyKg: 0, totalGeneratedRedQtyKg: 0, totalGeneratedBlueQtyKg: 0, totalGeneratedWhiteQtyKg: 0,
          totalReceivedYellowQtyKg: 0, totalReceivedRedQtyKg: 0, totalReceivedBlueQtyKg: 0, totalReceivedWhiteQtyKg: 0,
          totalDiffYellowQtyKg: 0, totalDiffRedQtyKg: 0, totalDiffBlueQtyKg: 0, totalDiffWhiteQtyKg: 0,
        },
      };
    }

    const receivedRows = await this.wasteCollectionRepository
      .createQueryBuilder('wc')
      .select('wc.hcf_id', 'hcfId')
      .addSelect("TO_CHAR(MAX(wc.collection_date), 'YYYY-MM-DD')", 'receivedDate')
      .addSelect("TO_CHAR(MAX(wc.collected_at), 'HH24:MI')", 'receivedTime')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='yellow' THEN 1 ELSE 0 END)`, 'receivedYellowCount')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='yellow' THEN COALESCE(wc.weight_kg,0) ELSE 0 END)`, 'receivedYellowQtyKg')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='red' THEN 1 ELSE 0 END)`, 'receivedRedCount')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='red' THEN COALESCE(wc.weight_kg,0) ELSE 0 END)`, 'receivedRedQtyKg')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='blue' THEN 1 ELSE 0 END)`, 'receivedBlueCount')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='blue' THEN COALESCE(wc.weight_kg,0) ELSE 0 END)`, 'receivedBlueQtyKg')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='white' THEN 1 ELSE 0 END)`, 'receivedWhiteCount')
      .addSelect(`SUM(CASE WHEN LOWER(wc.waste_color)='white' THEN COALESCE(wc.weight_kg,0) ELSE 0 END)`, 'receivedWhiteQtyKg')
      .where('wc.is_deleted = false')
      .andWhere('wc.collection_date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
      .andWhere('wc.hcf_id IN (:...hcfIds)', { hcfIds })
      .groupBy('wc.hcf_id')
      .getRawMany();
    const receivedMap = new Map(receivedRows.map((r) => [r.hcfId, r]));

    const hcfs = await this.hcfRepository.find({ where: { hcfId: In(hcfIds), isDeleted: false } });
    const areaIds = [...new Set(hcfs.map((h) => h.areaId).filter(Boolean))] as string[];
    const hcfTypeCodes = [...new Set(hcfs.map((h) => h.hcfTypeCode).filter(Boolean))] as string[];
    const [areas, hcfTypes] = await Promise.all([
      areaIds.length ? this.areaRepository.find({ where: { areaId: In(areaIds), isDeleted: false } }) : [],
      hcfTypeCodes.length ? this.hcfTypeRepository.find({ where: { hcfTypeCode: In(hcfTypeCodes), isDeleted: false } }) : [],
    ]);
    const hcfMap = new Map(hcfs.map((h) => [h.hcfId, h]));
    const areaMap = new Map(areas.map((a) => [a.areaId, a.areaName]));
    const typeMap = new Map(hcfTypes.map((t) => [t.hcfTypeCode, t.hcfTypeName]));

    const data: PcbComplianceReportItemDto[] = generatedRows.map((g, idx) => {
      const r = receivedMap.get(g.hcfId);
      const hcf = hcfMap.get(g.hcfId);
      const generatedYellowQtyKg = Number(g.generatedYellowQtyKg || 0);
      const generatedRedQtyKg = Number(g.generatedRedQtyKg || 0);
      const generatedBlueQtyKg = Number(g.generatedBlueQtyKg || 0);
      const generatedWhiteQtyKg = Number(g.generatedWhiteQtyKg || 0);
      const receivedYellowQtyKg = Number(r?.receivedYellowQtyKg || 0);
      const receivedRedQtyKg = Number(r?.receivedRedQtyKg || 0);
      const receivedBlueQtyKg = Number(r?.receivedBlueQtyKg || 0);
      const receivedWhiteQtyKg = Number(r?.receivedWhiteQtyKg || 0);
      return {
        serialNo: idx + 1,
        hcfId: g.hcfId,
        hcfName: hcf?.hcfName || '-',
        area: hcf?.areaId ? areaMap.get(hcf.areaId) || '-' : '-',
        hcfType: hcf?.hcfTypeCode ? typeMap.get(hcf.hcfTypeCode) || hcf.hcfTypeCode : '-',
        generatedDate: g.generatedDate || '-',
        generatedTime: g.generatedTime || '-',
        generatedYellowCount: Number(g.generatedYellowCount || 0),
        generatedYellowQtyKg,
        generatedRedCount: Number(g.generatedRedCount || 0),
        generatedRedQtyKg,
        generatedBlueCount: Number(g.generatedBlueCount || 0),
        generatedBlueQtyKg,
        generatedWhiteCount: Number(g.generatedWhiteCount || 0),
        generatedWhiteQtyKg,
        receivedDate: r?.receivedDate || '-',
        receivedTime: r?.receivedTime || '-',
        receivedYellowCount: Number(r?.receivedYellowCount || 0),
        receivedYellowQtyKg,
        receivedRedCount: Number(r?.receivedRedCount || 0),
        receivedRedQtyKg,
        receivedBlueCount: Number(r?.receivedBlueCount || 0),
        receivedBlueQtyKg,
        receivedWhiteCount: Number(r?.receivedWhiteCount || 0),
        receivedWhiteQtyKg,
        diffYellowQtyKg: Number((generatedYellowQtyKg - receivedYellowQtyKg).toFixed(2)),
        diffRedQtyKg: Number((generatedRedQtyKg - receivedRedQtyKg).toFixed(2)),
        diffBlueQtyKg: Number((generatedBlueQtyKg - receivedBlueQtyKg).toFixed(2)),
        diffWhiteQtyKg: Number((generatedWhiteQtyKg - receivedWhiteQtyKg).toFixed(2)),
      };
    });

    const totals = {
      totalGeneratedYellowQtyKg: Number(data.reduce((s, x) => s + x.generatedYellowQtyKg, 0).toFixed(2)),
      totalGeneratedRedQtyKg: Number(data.reduce((s, x) => s + x.generatedRedQtyKg, 0).toFixed(2)),
      totalGeneratedBlueQtyKg: Number(data.reduce((s, x) => s + x.generatedBlueQtyKg, 0).toFixed(2)),
      totalGeneratedWhiteQtyKg: Number(data.reduce((s, x) => s + x.generatedWhiteQtyKg, 0).toFixed(2)),
      totalReceivedYellowQtyKg: Number(data.reduce((s, x) => s + x.receivedYellowQtyKg, 0).toFixed(2)),
      totalReceivedRedQtyKg: Number(data.reduce((s, x) => s + x.receivedRedQtyKg, 0).toFixed(2)),
      totalReceivedBlueQtyKg: Number(data.reduce((s, x) => s + x.receivedBlueQtyKg, 0).toFixed(2)),
      totalReceivedWhiteQtyKg: Number(data.reduce((s, x) => s + x.receivedWhiteQtyKg, 0).toFixed(2)),
      totalDiffYellowQtyKg: Number(data.reduce((s, x) => s + x.diffYellowQtyKg, 0).toFixed(2)),
      totalDiffRedQtyKg: Number(data.reduce((s, x) => s + x.diffRedQtyKg, 0).toFixed(2)),
      totalDiffBlueQtyKg: Number(data.reduce((s, x) => s + x.diffBlueQtyKg, 0).toFixed(2)),
      totalDiffWhiteQtyKg: Number(data.reduce((s, x) => s + x.diffWhiteQtyKg, 0).toFixed(2)),
    };

    return { header: { fromDate, toDate }, data, totals };
  }
}

