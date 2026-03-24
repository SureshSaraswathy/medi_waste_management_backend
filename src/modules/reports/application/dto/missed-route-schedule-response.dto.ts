export interface MissedRouteScheduleItemDto {
  date: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  hcfCode: string;
  hcfName: string;
  area: string;
  status: 'Missed';
  remarks: string;
}

export interface MissedRouteScheduleRouteOptionDto {
  routeId: string;
  routeName: string;
}

export interface MissedRouteScheduleResponseDto {
  data: MissedRouteScheduleItemDto[];
  meta: {
    totalRecords: number;
    routeOptions: MissedRouteScheduleRouteOptionDto[];
    areaOptions: string[];
  };
}

