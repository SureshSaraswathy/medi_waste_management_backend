export interface CostAnalysisReportItemDto {
  date: string;
  driverPerDay: number;
  supervisorPerDay: number;
  pickerPerDay: number;
  totalKms: number;
  mileage: number;
  fuelCostPerDay: number;
  totalPerDay: number;
}

export interface CostAnalysisReportResponseDto {
  data: CostAnalysisReportItemDto[];
  meta: {
    totalRecords: number;
    routeOptions: Array<{ routeId: string; routeName: string }>;
  };
}

