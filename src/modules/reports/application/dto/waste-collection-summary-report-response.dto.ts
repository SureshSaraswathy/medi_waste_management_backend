export type WasteCollectionSummaryOption = 'Route' | 'HCF' | 'Period' | 'PCB Zone';

export class WasteColorWeightDto {
  yellowWeight!: number;
  redWeight!: number;
  blueWeight!: number;
  whiteWeight!: number;
  totalWeight!: number;
}

export class RouteWiseWasteCollectionItemDto extends WasteColorWeightDto {
  serialNo!: number;
  hcfCode!: string;
  hcfShortName!: string;
  area!: string;
}

export class HcfWiseDailyCollectionItemDto extends WasteColorWeightDto {
  serialNo!: number;
  date!: string;
  yellowCount!: number;
  redCount!: number;
  blueCount!: number;
  whiteCount!: number;
}

export class PcbZoneSummaryItemDto extends WasteColorWeightDto {
  serialNo!: number;
  hcfCode!: string;
  hcfName!: string;
  serviceAddress!: string;
}

export class MissingCollectionItemDto {
  serialNo!: number;
  date!: string;
  hcfCode!: string;
  hcfName!: string;
  area!: string;
  route!: string;
  reason!: string;
}

export class WasteCollectionSummaryReportMetaDto {
  routeOptions!: Array<{ routeId: string; routeName: string }>;
  hcfOptions!: Array<{ hcfId: string; hcfName: string }>;
  pcbZoneOptions!: Array<{ pcbZoneId: string; pcbZoneName: string }>;
}

export class WasteCollectionSummaryReportResponseDto {
  option!: WasteCollectionSummaryOption;
  headerTitle!: string;
  routeWiseRows!: RouteWiseWasteCollectionItemDto[];
  hcfWiseRows!: HcfWiseDailyCollectionItemDto[];
  periodWiseRows!: RouteWiseWasteCollectionItemDto[];
  pcbZoneRows!: PcbZoneSummaryItemDto[];
  missingRows!: MissingCollectionItemDto[];
  meta!: WasteCollectionSummaryReportMetaDto;
}

