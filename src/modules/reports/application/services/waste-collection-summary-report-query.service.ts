import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WasteTransactionEntity } from '../../../waste-transaction/infrastructure/transaction/waste-transaction.entity';
import { RouteHcfEntity } from '../../../route-hcf/infrastructure/persistence/route-hcf.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';
import { RouteEntity } from '../../../route/infrastructure/persistence/route.entity';
import { AreaEntity } from '../../../area/infrastructure/persistence/area.entity';
import { PcbZoneEntity } from '../../../pcb-zone/infrastructure/persistence/pcb-zone.entity';
import { WasteCollectionEntity } from '../../../waste-collection/infrastructure/transaction/waste-collection.entity';
import { WasteCollectionSummaryReportRequestDto } from '../dto/waste-collection-summary-report-request.dto';
import {
  HcfWiseDailyCollectionItemDto,
  MissingCollectionItemDto,
  PcbZoneSummaryItemDto,
  RouteWiseWasteCollectionItemDto,
  WasteCollectionSummaryReportResponseDto,
} from '../dto/waste-collection-summary-report-response.dto';

type AggValue = {
  yellowWeight: number;
  redWeight: number;
  blueWeight: number;
  whiteWeight: number;
  yellowCount: number;
  redCount: number;
  blueCount: number;
  whiteCount: number;
};

@Injectable()
export class WasteCollectionSummaryReportQueryService {
  constructor(
    @InjectRepository(WasteTransactionEntity, 'transaction')
    private readonly wasteTransactionRepository: Repository<WasteTransactionEntity>,
    @InjectRepository(RouteHcfEntity, 'master')
    private readonly routeHcfRepository: Repository<RouteHcfEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepository: Repository<HcfEntity>,
    @InjectRepository(RouteEntity, 'master')
    private readonly routeRepository: Repository<RouteEntity>,
    @InjectRepository(AreaEntity, 'master')
    private readonly areaRepository: Repository<AreaEntity>,
    @InjectRepository(PcbZoneEntity, 'master')
    private readonly pcbZoneRepository: Repository<PcbZoneEntity>,
    @InjectRepository(WasteCollectionEntity, 'transaction')
    private readonly wasteCollectionRepository: Repository<WasteCollectionEntity>,
  ) {}

  async getReport(
    filters: WasteCollectionSummaryReportRequestDto,
  ): Promise<WasteCollectionSummaryReportResponseDto> {
    const option = filters.option;
    const fromDate = (filters.fromDate || '').trim();
    const toDate = (filters.toDate || '').trim();
    const routeId = (filters.routeId || '').trim();
    const hcfId = (filters.hcfId || '').trim();
    const pcbZoneId = (filters.pcbZoneId || '').trim();

    if (!fromDate || !toDate) {
      throw new BadRequestException('From date and To date are required');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('From date cannot be later than To date');
    }
    if (option === 'Route' && !routeId) throw new BadRequestException('Route is required');
    if (option === 'HCF' && !hcfId) throw new BadRequestException('HCF is required');
    if (option === 'PCB Zone' && !pcbZoneId) throw new BadRequestException('PCB Zone is required');

    const [allRoutes, allHcfs, allPcbZones] = await Promise.all([
      this.routeRepository.find({ where: { isDeleted: false }, order: { routeName: 'ASC' } }),
      this.hcfRepository.find({ where: { isDeleted: false }, order: { hcfName: 'ASC' } }),
      this.pcbZoneRepository.find({ where: { isDeleted: false }, order: { pcbZoneName: 'ASC' } }),
    ]);

    const selectedRoute = allRoutes.find((r) => r.routeId === routeId);
    const selectedHcf = allHcfs.find((h) => h.hcfId === hcfId);
    const selectedZone = allPcbZones.find((z) => z.pcbZoneId === pcbZoneId);

    const hcfById = new Map(allHcfs.map((h) => [h.hcfId, h]));
    const areaIds = [...new Set(allHcfs.map((h) => h.areaId).filter(Boolean))] as string[];
    const areas = areaIds.length
      ? await this.areaRepository.find({ where: { areaId: In(areaIds), isDeleted: false } })
      : [];
    const areaById = new Map(areas.map((a) => [a.areaId, a]));

    const routeMappingsQb = this.routeHcfRepository.createQueryBuilder('rh').where('rh.is_deleted = false');
    if (option === 'Route') routeMappingsQb.andWhere('rh.route_id = :routeId', { routeId });
    if (option === 'HCF') routeMappingsQb.andWhere('rh.hcf_id = :hcfId', { hcfId });
    const mappings = await routeMappingsQb.getMany();

    const mappedHcfIdsInitial = [...new Set(mappings.map((m) => m.hcfId))];
    const filteredMappedHcfIds =
      option === 'PCB Zone'
        ? mappedHcfIdsInitial.filter((id) => hcfById.get(id)?.pcbZone === pcbZoneId)
        : mappedHcfIdsInitial;

    const routeById = new Map(allRoutes.map((r) => [r.routeId, r]));
    const mappingsFiltered = mappings.filter((m) => filteredMappedHcfIds.includes(m.hcfId));

    const txQb = this.wasteTransactionRepository
      .createQueryBuilder('wt')
      .where('wt.is_deleted = false')
      .andWhere('wt.pickup_date BETWEEN :fromDate AND :toDate', { fromDate, toDate });
    if (filteredMappedHcfIds.length) {
      txQb.andWhere('wt.hcf_id IN (:...hcfIds)', { hcfIds: filteredMappedHcfIds });
    } else if (option === 'HCF' && hcfId) {
      txQb.andWhere('wt.hcf_id = :hcfId', { hcfId });
    } else if (option === 'Period') {
      // keep all HCF for period option
    } else {
      txQb.andWhere('1 = 0');
    }
    const txRows = await txQb.getMany();

    const byHcf = new Map<string, AggValue>();
    const byHcfDate = new Map<string, AggValue>();

    for (const tx of txRows) {
      const hcfKey = tx.hcfId;
      const dateKey = `${tx.hcfId}|${this.toDate(tx.pickupDate)}`;
      this.sumInto(byHcf, hcfKey, tx);
      this.sumInto(byHcfDate, dateKey, tx);
    }

    // Fallback: if no transaction rows are present, derive weights from waste_collections.
    // This keeps report usable where operational data is captured in waste_collections.
    if (txRows.length === 0) {
      const wcQb = this.wasteCollectionRepository
        .createQueryBuilder('wc')
        .where('wc.is_deleted = false')
        .andWhere('wc.collection_date BETWEEN :fromDate AND :toDate', { fromDate, toDate });

      if (filteredMappedHcfIds.length) {
        wcQb.andWhere('wc.hcf_id IN (:...hcfIds)', { hcfIds: filteredMappedHcfIds });
      } else if (option === 'HCF' && hcfId) {
        wcQb.andWhere('wc.hcf_id = :hcfId', { hcfId });
      } else if (option !== 'Period') {
        wcQb.andWhere('1 = 0');
      }

      const wcRows = await wcQb.getMany();
      for (const wc of wcRows) {
        const hcfKey = wc.hcfId;
        const dateKey = `${wc.hcfId}|${this.toDate(wc.collectionDate)}`;
        this.sumWasteCollectionInto(byHcf, hcfKey, wc);
        this.sumWasteCollectionInto(byHcfDate, dateKey, wc);
      }
    }

    const routeWiseRows: RouteWiseWasteCollectionItemDto[] = [];
    const hcfWiseRows: HcfWiseDailyCollectionItemDto[] = [];
    const periodWiseRows: RouteWiseWasteCollectionItemDto[] = [];
    const pcbZoneRows: PcbZoneSummaryItemDto[] = [];

    if (option === 'Route') {
      const selectedMappings = mappingsFiltered.filter((m) => m.routeId === routeId);
      selectedMappings.forEach((m, idx) => {
        const hcf = hcfById.get(m.hcfId);
        const agg = byHcf.get(m.hcfId) || this.emptyAgg();
        routeWiseRows.push({
          serialNo: idx + 1,
          hcfCode: hcf?.hcfCode || '-',
          hcfShortName: hcf?.hcfShortName || hcf?.hcfName || '-',
          area: this.areaName(hcf?.areaId || null, hcf?.district || null, areaById),
          ...this.weights(agg),
        });
      });
    } else if (option === 'HCF') {
      const dates = this.dateRange(fromDate, toDate);
      dates.forEach((date, idx) => {
        const agg = byHcfDate.get(`${hcfId}|${date}`) || this.emptyAgg();
        hcfWiseRows.push({
          serialNo: idx + 1,
          date,
          yellowCount: agg.yellowCount,
          yellowWeight: agg.yellowWeight,
          redCount: agg.redCount,
          redWeight: agg.redWeight,
          blueCount: agg.blueCount,
          blueWeight: agg.blueWeight,
          whiteCount: agg.whiteCount,
          whiteWeight: agg.whiteWeight,
          totalWeight: agg.yellowWeight + agg.redWeight + agg.blueWeight + agg.whiteWeight,
        });
      });
    } else if (option === 'Period') {
      const hcfIds = [...new Set(txRows.map((tx) => tx.hcfId))];
      hcfIds.forEach((id, idx) => {
        const hcf = hcfById.get(id);
        const agg = byHcf.get(id) || this.emptyAgg();
        periodWiseRows.push({
          serialNo: idx + 1,
          hcfCode: hcf?.hcfCode || '-',
          hcfShortName: hcf?.hcfShortName || hcf?.hcfName || '-',
          area: this.areaName(hcf?.areaId || null, hcf?.district || null, areaById),
          ...this.weights(agg),
        });
      });
    } else if (option === 'PCB Zone') {
      filteredMappedHcfIds.forEach((id, idx) => {
        const hcf = hcfById.get(id);
        const agg = byHcf.get(id) || this.emptyAgg();
        pcbZoneRows.push({
          serialNo: idx + 1,
          hcfCode: hcf?.hcfCode || '-',
          hcfName: hcf?.hcfName || '-',
          serviceAddress: hcf?.serviceAddress || '-',
          ...this.weights(agg),
        });
      });
    }

    const missingRows: MissingCollectionItemDto[] = [];
    const dates = this.dateRange(fromDate, toDate);
    const expectedMappings = mappingsFiltered.filter((m) => {
      if (option === 'Route') return m.routeId === routeId;
      if (option === 'HCF') return m.hcfId === hcfId;
      if (option === 'PCB Zone') return hcfById.get(m.hcfId)?.pcbZone === pcbZoneId;
      return true;
    });

    let missIdx = 1;
    for (const map of expectedMappings) {
      const hcf = hcfById.get(map.hcfId);
      const route = routeById.get(map.routeId);
      for (const date of dates) {
        const actual = byHcfDate.get(`${map.hcfId}|${date}`);
        if (actual) continue;
        missingRows.push({
          serialNo: missIdx++,
          date,
          hcfCode: hcf?.hcfCode || '-',
          hcfName: hcf?.hcfName || '-',
          area: this.areaName(hcf?.areaId || null, hcf?.district || null, areaById),
          route: route ? `${route.routeCode} - ${route.routeName}` : '-',
          reason: 'No collection entry on expected schedule date',
        });
      }
    }

    return {
      option,
      headerTitle: this.headerTitle(option, selectedRoute?.routeName, selectedHcf?.hcfName, selectedZone?.pcbZoneName, fromDate, toDate),
      routeWiseRows,
      hcfWiseRows,
      periodWiseRows,
      pcbZoneRows,
      missingRows,
      meta: {
        routeOptions: allRoutes.map((r) => ({ routeId: r.routeId, routeName: `${r.routeCode} - ${r.routeName}` })),
        hcfOptions: allHcfs.map((h) => ({ hcfId: h.hcfId, hcfName: `${h.hcfCode} - ${h.hcfName}` })),
        pcbZoneOptions: allPcbZones.map((z) => ({ pcbZoneId: z.pcbZoneId, pcbZoneName: z.pcbZoneName })),
      },
    };
  }

  private headerTitle(option: string, routeName: string | undefined, hcfName: string | undefined, zoneName: string | undefined, fromDate: string, toDate: string): string {
    if (option === 'Route') return `Waste Collected Details for the Route ${routeName || '-'}`;
    if (option === 'HCF') return `Waste Collected Details from the HCF ${hcfName || '-'}`;
    if (option === 'PCB Zone') return `Waste Collected Details for PCB Zone ${zoneName || '-'} Period ${fromDate} to ${toDate}`;
    return `Waste Collected Details for the Period ${fromDate} to ${toDate}`;
  }

  private toDate(value: Date | string): string {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }

  private areaName(areaId: string | null, district: string | null, areaById: Map<string, AreaEntity>): string {
    if (areaId && areaById.get(areaId)?.areaName) return areaById.get(areaId)!.areaName;
    return district || '-';
  }

  private emptyAgg(): AggValue {
    return { yellowWeight: 0, redWeight: 0, blueWeight: 0, whiteWeight: 0, yellowCount: 0, redCount: 0, blueCount: 0, whiteCount: 0 };
  }

  private weights(agg: AggValue) {
    return {
      yellowWeight: agg.yellowWeight,
      redWeight: agg.redWeight,
      blueWeight: agg.blueWeight,
      whiteWeight: agg.whiteWeight,
      totalWeight: agg.yellowWeight + agg.redWeight + agg.blueWeight + agg.whiteWeight,
    };
  }

  private sumInto(map: Map<string, AggValue>, key: string, tx: WasteTransactionEntity): void {
    const current = map.get(key) || this.emptyAgg();
    current.yellowWeight += Number(tx.yellowWeightKg || 0);
    current.redWeight += Number(tx.redWeightKg || 0);
    current.blueWeight += Number(tx.blueWeightKg || 0);
    current.whiteWeight += Number(tx.whiteWeightKg || 0);
    current.yellowCount += Number(tx.yellowBagCount || 0);
    current.redCount += Number(tx.redBagCount || 0);
    current.blueCount += Number(tx.blueBagCount || 0);
    current.whiteCount += Number(tx.whiteBagCount || 0);
    map.set(key, current);
  }

  private sumWasteCollectionInto(
    map: Map<string, AggValue>,
    key: string,
    wc: WasteCollectionEntity,
  ): void {
    const current = map.get(key) || this.emptyAgg();
    const weight = Number(wc.weightKg || 0);
    const color = String(wc.wasteColor || '').toLowerCase();

    if (color === 'yellow') {
      current.yellowWeight += weight;
      current.yellowCount += 1;
    } else if (color === 'red') {
      current.redWeight += weight;
      current.redCount += 1;
    } else if (color === 'blue') {
      current.blueWeight += weight;
      current.blueCount += 1;
    } else if (color === 'white') {
      current.whiteWeight += weight;
      current.whiteCount += 1;
    }

    map.set(key, current);
  }

  private dateRange(fromDate: string, toDate: string): string[] {
    const result: string[] = [];
    const cur = new Date(`${fromDate}T00:00:00.000Z`);
    const end = new Date(`${toDate}T00:00:00.000Z`);
    while (cur <= end) {
      result.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return result;
  }
}

