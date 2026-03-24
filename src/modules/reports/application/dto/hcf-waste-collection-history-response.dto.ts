export interface HcfWasteCollectionHistoryItemDto {
  serialNo: number;
  date: string;
  latLong: string;
  inTime: string;
  outTime: string;
  yellowBagCount: number;
  yellowWeight: number;
  redBagCount: number;
  redWeight: number;
  blueBagCount: number;
  blueWeight: number;
  whiteBagCount: number;
  whiteWeight: number;
  totalWeight: number;
  remarks: string;
}

export interface HcfWasteCollectionHistoryResponseDto {
  data: HcfWasteCollectionHistoryItemDto[];
}

