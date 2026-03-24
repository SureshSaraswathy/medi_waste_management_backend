import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WasteCollectionEntity } from '../../../waste-collection/infrastructure/transaction/waste-collection.entity';
import { RouteAssignmentEntity } from '../../../route-assignment/infrastructure/transaction/route-assignment.entity';
import { RouteHcfEntity } from '../../../route-hcf/infrastructure/persistence/route-hcf.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';
import { AreaEntity } from '../../../area/infrastructure/persistence/area.entity';
import { RouteEntity } from '../../../route/infrastructure/persistence/route.entity';
import { UserEntity } from '../../../user/infrastructure/persistence/user.entity';
import { RouteTripReportRequestDto } from '../dto/route-trip-report-request.dto';
import {
  RouteTripReportItemDto,
  RouteTripReportResponseDto,
  RouteTripReportRouteOptionDto,
} from '../dto/route-trip-report-response.dto';

type AggregatedRow = {
  routeId: string;
  hcfId: string;
  collectedBy: string | null;
  yellow: string | number;
  red: string | number;
  blue: string | number;
  white: string | number;
  timeIn: Date | null;
  timeOut: Date | null;
};

@Injectable()
export class RouteTripReportQueryService {
  constructor(
    @InjectRepository(WasteCollectionEntity, 'transaction')
    private readonly wasteCollectionRepository: Repository<WasteCollectionEntity>,
    @InjectRepository(RouteAssignmentEntity, 'transaction')
    private readonly routeAssignmentRepository: Repository<RouteAssignmentEntity>,
    @InjectRepository(RouteHcfEntity, 'master')
    private readonly routeHcfRepository: Repository<RouteHcfEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepository: Repository<HcfEntity>,
    @InjectRepository(AreaEntity, 'master')
    private readonly areaRepository: Repository<AreaEntity>,
    @InjectRepository(RouteEntity, 'master')
    private readonly routeRepository: Repository<RouteEntity>,
    @InjectRepository(UserEntity, 'master')
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getRouteTripReport(
    filters: RouteTripReportRequestDto,
  ): Promise<RouteTripReportResponseDto> {
    const normalizedDate = filters.date?.trim();
    const normalizedRouteId = filters.routeId?.trim();
    const normalizedCompanyId = filters.companyId?.trim();

    if (!normalizedDate) {
      throw new BadRequestException('Date is required for Route Trip Report');
    }

    const routeOptions = await this.getRouteOptions(normalizedCompanyId);

    let assignmentsForDate: RouteAssignmentEntity[] = [];
    let routeIdsForBase: string[] | undefined;

    if (normalizedDate) {
      const assignmentQb = this.routeAssignmentRepository
        .createQueryBuilder('ra')
        .where('ra.is_deleted = false')
        .andWhere('ra.assignment_date = :assignmentDate', {
          assignmentDate: normalizedDate,
        });

      if (normalizedCompanyId) {
        assignmentQb.andWhere('ra.company_id = :companyId', { companyId: normalizedCompanyId });
      }
      if (normalizedRouteId) {
        assignmentQb.andWhere('ra.route_id = :routeId', { routeId: normalizedRouteId });
      }

      assignmentsForDate = await assignmentQb.getMany();
      routeIdsForBase = [...new Set(assignmentsForDate.map((a) => a.routeId))];
      if (!routeIdsForBase.length) {
        return { data: [], meta: { totalRecords: 0, routeOptions } };
      }
    } else if (normalizedRouteId) {
      routeIdsForBase = [normalizedRouteId];
    }

    const mappingQb = this.routeHcfRepository
      .createQueryBuilder('rh')
      .select('rh.route_id', 'routeId')
      .addSelect('rh.hcf_id', 'hcfId')
      .addSelect('COALESCE(rh.sequence_order, 999999)', 'sequenceOrder')
      .where('rh.is_deleted = false');

    if (normalizedCompanyId) {
      mappingQb.andWhere('rh.company_id = :companyId', { companyId: normalizedCompanyId });
    }
    if (routeIdsForBase?.length) {
      mappingQb.andWhere('rh.route_id IN (:...routeIds)', { routeIds: routeIdsForBase });
    }

    const mappingRows = (await mappingQb.getRawMany()) as Array<{
      routeId: string;
      hcfId: string;
      sequenceOrder: string | number;
    }>;

    const baseOrder = new Map<string, number>();
    for (const row of mappingRows) {
      baseOrder.set(`${row.routeId}|${row.hcfId}`, Number(row.sequenceOrder || 999999));
    }

    const qb = this.wasteCollectionRepository
      .createQueryBuilder('wc')
      .innerJoin(
        RouteAssignmentEntity,
        'ra',
        'ra.route_assignment_id = wc.route_assignment_id AND ra.is_deleted = false',
      )
      .select('ra.route_id', 'routeId')
      .addSelect('wc.hcfId', 'hcfId')
      .addSelect(`NULLIF(MIN(wc.collected_by::text), '')`, 'collectedBy')
      .addSelect(
        `SUM(CASE WHEN LOWER(wc.waste_color) = 'yellow' THEN 1 ELSE 0 END)`,
        'yellow',
      )
      .addSelect(
        `SUM(CASE WHEN LOWER(wc.waste_color) = 'red' THEN 1 ELSE 0 END)`,
        'red',
      )
      .addSelect(
        `SUM(CASE WHEN LOWER(wc.waste_color) = 'blue' THEN 1 ELSE 0 END)`,
        'blue',
      )
      .addSelect(
        `SUM(CASE WHEN LOWER(wc.waste_color) = 'white' THEN 1 ELSE 0 END)`,
        'white',
      )
      .addSelect('MIN(wc.collected_at)', 'timeIn')
      .addSelect('MAX(wc.collected_at)', 'timeOut')
      .where('wc.is_deleted = :isDeleted', { isDeleted: false })
      .groupBy('ra.route_id')
      .addGroupBy('wc.hcf_id')
      .orderBy('ra.route_id', 'ASC')
      .addOrderBy('wc.hcf_id', 'ASC');

    if (normalizedDate) {
      qb.andWhere('wc.collection_date = :collectionDate', {
        collectionDate: normalizedDate,
      });
    }

    if (normalizedCompanyId) {
      qb.andWhere('wc.company_id = :companyId', {
        companyId: normalizedCompanyId,
      });
    }

    if (normalizedRouteId) {
      qb.andWhere('ra.route_id = :routeId', {
        routeId: normalizedRouteId,
      });
    }

    const raw = (await qb.getRawMany()) as AggregatedRow[];
    const aggregateMap = new Map(raw.map((r) => [`${r.routeId}|${r.hcfId}`, r]));

    const allKeys = new Set<string>([
      ...Array.from(baseOrder.keys()),
      ...Array.from(aggregateMap.keys()),
    ]);

    if (!allKeys.size) {
      return { data: [], meta: { totalRecords: 0, routeOptions } };
    }

    const hcfIds = [...new Set(Array.from(allKeys).map((k) => k.split('|')[1]).filter(Boolean))];
    const routeDriverMap = new Map<string, string>();
    for (const assignment of assignmentsForDate) {
      if (!routeDriverMap.has(assignment.routeId)) {
        routeDriverMap.set(assignment.routeId, assignment.driverId);
      }
    }

    const userIds = [
      ...new Set([
        ...raw.map((r) => r.collectedBy).filter(Boolean),
        ...Array.from(routeDriverMap.values()).filter(Boolean),
      ]),
    ] as string[];

    const hcfs = hcfIds.length
      ? await this.hcfRepository.find({
          where: {
            hcfId: In(hcfIds),
            isDeleted: false,
          },
        })
      : [];
    const hcfMap = new Map(hcfs.map((h) => [h.hcfId, h]));

    const areaIds = [...new Set(hcfs.map((h) => h.areaId).filter(Boolean))] as string[];
    const areas = areaIds.length
      ? await this.areaRepository.find({
          where: {
            areaId: In(areaIds),
            isDeleted: false,
          },
        })
      : [];
    const areaMap = new Map(areas.map((a) => [a.areaId, a]));

    const users = userIds.length
      ? await this.userRepository.find({
          where: {
            userId: In(userIds),
            isDeleted: false,
          },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.userId, u]));

    const orderedKeys = Array.from(allKeys).sort((a, b) => {
      const [routeA] = a.split('|');
      const [routeB] = b.split('|');
      if (routeA !== routeB) return routeA.localeCompare(routeB);
      return (baseOrder.get(a) ?? 999999) - (baseOrder.get(b) ?? 999999);
    });

    const data: RouteTripReportItemDto[] = orderedKeys.map((key) => {
      const [routeId, hcfId] = key.split('|');
      const row = aggregateMap.get(key);
      const hcf = hcfMap.get(hcfId);
      const area = hcf?.areaId ? areaMap.get(hcf.areaId) : undefined;
      const collectedUser = row?.collectedBy ? userMap.get(row.collectedBy) : undefined;
      const driverUser = routeDriverMap.get(routeId)
        ? userMap.get(routeDriverMap.get(routeId) as string)
        : undefined;
      const yellow = Number(row?.yellow || 0);
      const red = Number(row?.red || 0);
      const blue = Number(row?.blue || 0);
      const white = Number(row?.white || 0);

      return {
        hcfCode: hcf?.hcfCode || '-',
        hcfShortName: hcf?.hcfShortName || hcf?.hcfName || '-',
        area: area?.areaName || '-',
        yellow,
        red,
        blue,
        white,
        total: yellow + red + blue + white,
        nameSign: collectedUser?.userName || driverUser?.userName || '-',
        timeIn: this.formatTime(row?.timeIn || null),
        timeOut: this.formatTime(row?.timeOut || null),
      };
    });

    return {
      data,
      meta: {
        totalRecords: data.length,
        routeOptions,
      },
    };
  }

  private async getRouteOptions(
    companyId?: string,
  ): Promise<RouteTripReportRouteOptionDto[]> {
    const routes = await this.routeRepository.find({
      where: {
        ...(companyId ? { companyId } : {}),
        isDeleted: false,
      },
      order: { routeName: 'ASC' },
    });

    return routes.map((route) => ({
      routeId: route.routeId,
      routeName: route.routeName || route.routeCode,
    }));
  }

  private formatTime(value: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toISOString().slice(11, 16);
  }
}
