import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RouteAssignmentEntity, RouteAssignmentStatus } from '../../../route-assignment/infrastructure/transaction/route-assignment.entity';
import { WasteCollectionEntity } from '../../../waste-collection/infrastructure/transaction/waste-collection.entity';
import { RouteEntity } from '../../../route/infrastructure/persistence/route.entity';
import { RouteHcfEntity } from '../../../route-hcf/infrastructure/persistence/route-hcf.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';
import { AreaEntity } from '../../../area/infrastructure/persistence/area.entity';
import { MissedRouteScheduleRequestDto } from '../dto/missed-route-schedule-request.dto';
import {
  MissedRouteScheduleItemDto,
  MissedRouteScheduleResponseDto,
} from '../dto/missed-route-schedule-response.dto';

@Injectable()
export class MissedRouteScheduleQueryService {
  constructor(
    @InjectRepository(RouteAssignmentEntity, 'transaction')
    private readonly routeAssignmentRepository: Repository<RouteAssignmentEntity>,
    @InjectRepository(WasteCollectionEntity, 'transaction')
    private readonly wasteCollectionRepository: Repository<WasteCollectionEntity>,
    @InjectRepository(RouteEntity, 'master')
    private readonly routeRepository: Repository<RouteEntity>,
    @InjectRepository(RouteHcfEntity, 'master')
    private readonly routeHcfRepository: Repository<RouteHcfEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepository: Repository<HcfEntity>,
    @InjectRepository(AreaEntity, 'master')
    private readonly areaRepository: Repository<AreaEntity>,
  ) {}

  async getMissedRouteSchedule(
    filters: MissedRouteScheduleRequestDto,
  ): Promise<MissedRouteScheduleResponseDto> {
    const date = filters.date?.trim();
    if (!date) {
      throw new BadRequestException('Date is required for Missed Route Schedule report');
    }
    const routeId = filters.routeId?.trim();
    const companyId = filters.companyId?.trim();
    const areaFilter = (filters.area || '').trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);

    const assignmentQb = this.routeAssignmentRepository
      .createQueryBuilder('ra')
      .where('ra.is_deleted = false')
      .andWhere('ra.assignment_date = :date', { date });
    if (companyId) assignmentQb.andWhere('ra.company_id = :companyId', { companyId });
    if (routeId) assignmentQb.andWhere('ra.route_id = :routeId', { routeId });

    const assignments = await assignmentQb.getMany();
    if (!assignments.length) {
      return { data: [], meta: { totalRecords: 0, routeOptions: [], areaOptions: [] } };
    }

    const assignmentIds = assignments.map((a) => a.routeAssignmentId);
    const routeIds = [...new Set(assignments.map((a) => a.routeId))];

    const [routes, mappings, collections] = await Promise.all([
      this.routeRepository.find({
        where: { routeId: In(routeIds), isDeleted: false },
      }),
      this.routeHcfRepository.find({
        where: { routeId: In(routeIds), isDeleted: false },
      }),
      this.wasteCollectionRepository.find({
        where: { routeAssignmentId: In(assignmentIds), isDeleted: false },
      }),
    ]);

    const routeMap = new Map(routes.map((r) => [r.routeId, r]));
    const collectionAssignmentSet = new Set(
      collections.map((c) => c.routeAssignmentId).filter(Boolean) as string[],
    );

    const hcfIds = [...new Set(mappings.map((m) => m.hcfId).filter(Boolean))];
    const hcfs = hcfIds.length
      ? await this.hcfRepository.find({ where: { hcfId: In(hcfIds), isDeleted: false } })
      : [];
    const hcfMap = new Map(hcfs.map((h) => [h.hcfId, h]));

    const areaIds = [...new Set(hcfs.map((h) => h.areaId).filter(Boolean))] as string[];
    const areas = areaIds.length
      ? await this.areaRepository.find({ where: { areaId: In(areaIds), isDeleted: false } })
      : [];
    const areaMap = new Map(areas.map((a) => [a.areaId, a]));

    const hcfIdsByRoute = new Map<string, string[]>();
    for (const m of mappings) {
      if (!hcfIdsByRoute.has(m.routeId)) hcfIdsByRoute.set(m.routeId, []);
      hcfIdsByRoute.get(m.routeId)!.push(m.hcfId);
    }

    const rows: MissedRouteScheduleItemDto[] = [];

    for (const assignment of assignments) {
      const hasPickup = collectionAssignmentSet.has(assignment.routeAssignmentId);
      const assignmentDate = this.normalizeDate(assignment.assignmentDate);
      const isScheduleMissed =
        assignmentDate < today && assignment.status !== RouteAssignmentStatus.COMPLETED;
      const isMissed = !hasPickup || isScheduleMissed;
      if (!isMissed) continue;

      const remarks: string[] = [];
      if (!hasPickup) remarks.push('No pickup / no entry');
      if (isScheduleMissed) remarks.push('Missed schedule');
      if (!remarks.length) remarks.push('Missed route');

      const route = routeMap.get(assignment.routeId);
      const mappedHcfIds = hcfIdsByRoute.get(assignment.routeId) || [];

      if (!mappedHcfIds.length) {
        rows.push({
          date: assignmentDate,
          routeId: assignment.routeId,
          routeCode: route?.routeCode || '-',
          routeName: route?.routeName || '-',
          hcfCode: '-',
          hcfName: '-',
          area: '-',
          status: 'Missed',
          remarks: remarks.join(', '),
        });
        continue;
      }

      for (const hid of mappedHcfIds) {
        const hcf = hcfMap.get(hid);
        const areaName =
          (hcf?.areaId ? areaMap.get(hcf.areaId)?.areaName : null) ||
          hcf?.district ||
          '-';

        rows.push({
          date: assignmentDate,
          routeId: assignment.routeId,
          routeCode: route?.routeCode || '-',
          routeName: route?.routeName || '-',
          hcfCode: hcf?.hcfCode || '-',
          hcfName: hcf?.hcfShortName || hcf?.hcfName || '-',
          area: areaName,
          status: 'Missed',
          remarks: remarks.join(', '),
        });
      }
    }

    let filtered = rows;
    if (areaFilter && areaFilter !== 'all') {
      filtered = filtered.filter((r) => r.area.toLowerCase() === areaFilter);
    }

    filtered.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      if (a.routeName !== b.routeName) return a.routeName.localeCompare(b.routeName);
      return a.hcfCode.localeCompare(b.hcfCode);
    });

    const routeOptions = Array.from(
      new Map(
        rows.map((r) => [
          r.routeId,
          {
            routeId: r.routeId,
            routeName: `${r.routeCode} - ${r.routeName}`,
          },
        ]),
      ).values(),
    );

    const areaOptions = Array.from(
      new Set(rows.map((r) => r.area).filter((a) => a && a !== '-')),
    ).sort();

    return {
      data: filtered,
      meta: {
        totalRecords: filtered.length,
        routeOptions,
        areaOptions,
      },
    };
  }

  private normalizeDate(value: Date | string): string {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }
}

