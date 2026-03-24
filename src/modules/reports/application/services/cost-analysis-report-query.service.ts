import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleWasteCollectionEntity } from '../../../vehicle-waste-collection/infrastructure/transaction/vehicle-waste-collection.entity';
import { RouteAssignmentEntity } from '../../../route-assignment/infrastructure/transaction/route-assignment.entity';
import { RouteEntity } from '../../../route/infrastructure/persistence/route.entity';
import { CostAnalysisReportRequestDto } from '../dto/cost-analysis-report-request.dto';
import {
  CostAnalysisReportItemDto,
  CostAnalysisReportResponseDto,
} from '../dto/cost-analysis-report-response.dto';

type CostOption = 'All' | 'Manpower Only' | 'Fuel Only';

@Injectable()
export class CostAnalysisReportQueryService {
  private static readonly DRIVER_DAY_COST = 850;
  private static readonly SUPERVISOR_DAY_COST = 600;
  private static readonly PICKER_DAY_COST = 520;
  private static readonly FUEL_RATE_PER_LITER = 96;

  constructor(
    @InjectRepository(VehicleWasteCollectionEntity, 'transaction')
    private readonly vehicleWasteCollectionRepository: Repository<VehicleWasteCollectionEntity>,
    @InjectRepository(RouteAssignmentEntity, 'transaction')
    private readonly routeAssignmentRepository: Repository<RouteAssignmentEntity>,
    @InjectRepository(RouteEntity, 'master')
    private readonly routeRepository: Repository<RouteEntity>,
  ) {}

  async getCostAnalysisReport(
    filters: CostAnalysisReportRequestDto,
  ): Promise<CostAnalysisReportResponseDto> {
    const option = (filters.option || 'All') as CostOption;
    const routeId = (filters.routeId || '').trim();
    const fromDate = (filters.fromDate || '').trim();
    const toDate = (filters.toDate || '').trim();

    if (!fromDate || !toDate) {
      throw new BadRequestException('From date and To date are required');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('From date cannot be later than To date');
    }

    const routeOptions = await this.getRouteOptions();

    const rows = await this.routeAssignmentRepository
      .createQueryBuilder('ra')
      .innerJoin(
        VehicleWasteCollectionEntity,
        'vwc',
        [
          'vwc.vehicle_id = ra.vehicle_id',
          'vwc.collection_date = ra.assignment_date',
          'vwc.is_deleted = false',
          'ra.is_deleted = false',
        ].join(' AND '),
      )
      .select("TO_CHAR(ra.assignment_date, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(DISTINCT ra.driver_id)', 'driverCount')
      .addSelect('COUNT(DISTINCT ra.supervisor_id)', 'supervisorCount')
      .addSelect('COUNT(DISTINCT ra.picker_id)', 'pickerCount')
      .addSelect('COALESCE(SUM(vwc.vehicle_km), 0)', 'totalKms')
      .addSelect('COALESCE(SUM(vwc.fuel_usage_liters), 0)', 'fuelLiters')
      .where('ra.assignment_date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
      .andWhere(routeId && routeId !== 'All' ? 'ra.route_id = :routeId' : '1=1', {
        routeId,
      })
      .groupBy('ra.assignment_date')
      .orderBy('ra.assignment_date', 'ASC')
      .getRawMany();

    const data: CostAnalysisReportItemDto[] = rows.map((row) => {
      const driverCount = Number(row.driverCount || 0);
      const supervisorCount = Number(row.supervisorCount || 0);
      const pickerCount = Number(row.pickerCount || 0);
      const totalKms = Number(row.totalKms || 0);
      const fuelLiters = Number(row.fuelLiters || 0);

      let driverPerDay = driverCount * CostAnalysisReportQueryService.DRIVER_DAY_COST;
      let supervisorPerDay = supervisorCount * CostAnalysisReportQueryService.SUPERVISOR_DAY_COST;
      let pickerPerDay = pickerCount * CostAnalysisReportQueryService.PICKER_DAY_COST;
      let fuelCostPerDay = fuelLiters * CostAnalysisReportQueryService.FUEL_RATE_PER_LITER;

      if (option === 'Manpower Only') {
        fuelCostPerDay = 0;
      } else if (option === 'Fuel Only') {
        driverPerDay = 0;
        supervisorPerDay = 0;
        pickerPerDay = 0;
      }

      const mileage = fuelLiters > 0 ? totalKms / fuelLiters : 0;
      const totalPerDay = driverPerDay + supervisorPerDay + pickerPerDay + fuelCostPerDay;

      return {
        date: row.date,
        driverPerDay: Number(driverPerDay.toFixed(2)),
        supervisorPerDay: Number(supervisorPerDay.toFixed(2)),
        pickerPerDay: Number(pickerPerDay.toFixed(2)),
        totalKms: Number(totalKms.toFixed(2)),
        mileage: Number(mileage.toFixed(2)),
        fuelCostPerDay: Number(fuelCostPerDay.toFixed(2)),
        totalPerDay: Number(totalPerDay.toFixed(2)),
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

  private async getRouteOptions(): Promise<Array<{ routeId: string; routeName: string }>> {
    const routes = await this.routeRepository.find({
      where: { isDeleted: false },
      order: { routeName: 'ASC' },
    });
    return routes.map((route) => ({
      routeId: route.routeId,
      routeName: route.routeName || route.routeCode,
    }));
  }
}

