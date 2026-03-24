export interface RouteTripReportItemDto {
  hcfCode: string;
  hcfShortName: string;
  area: string;
  yellow: number;
  red: number;
  blue: number;
  white: number;
  total: number;
  nameSign: string;
  timeIn: string;
  timeOut: string;
}

export interface RouteTripReportRouteOptionDto {
  routeId: string;
  routeName: string;
}

export interface RouteTripReportResponseDto {
  data: RouteTripReportItemDto[];
  meta: {
    totalRecords: number;
    routeOptions: RouteTripReportRouteOptionDto[];
  };
}
