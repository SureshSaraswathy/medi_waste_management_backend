export interface PcbComplianceReportItemDto {
  serialNo: number;
  hcfId: string;
  hcfName: string;
  area: string;
  hcfType: string;

  generatedDate: string;
  generatedTime: string;
  generatedYellowCount: number;
  generatedYellowQtyKg: number;
  generatedRedCount: number;
  generatedRedQtyKg: number;
  generatedBlueCount: number;
  generatedBlueQtyKg: number;
  generatedWhiteCount: number;
  generatedWhiteQtyKg: number;

  receivedDate: string;
  receivedTime: string;
  receivedYellowCount: number;
  receivedYellowQtyKg: number;
  receivedRedCount: number;
  receivedRedQtyKg: number;
  receivedBlueCount: number;
  receivedBlueQtyKg: number;
  receivedWhiteCount: number;
  receivedWhiteQtyKg: number;

  diffYellowQtyKg: number;
  diffRedQtyKg: number;
  diffBlueQtyKg: number;
  diffWhiteQtyKg: number;
}

export interface PcbComplianceReportTotalsDto {
  totalGeneratedYellowQtyKg: number;
  totalGeneratedRedQtyKg: number;
  totalGeneratedBlueQtyKg: number;
  totalGeneratedWhiteQtyKg: number;
  totalReceivedYellowQtyKg: number;
  totalReceivedRedQtyKg: number;
  totalReceivedBlueQtyKg: number;
  totalReceivedWhiteQtyKg: number;
  totalDiffYellowQtyKg: number;
  totalDiffRedQtyKg: number;
  totalDiffBlueQtyKg: number;
  totalDiffWhiteQtyKg: number;
}

export interface PcbComplianceReportResponseDto {
  header: {
    fromDate: string;
    toDate: string;
  };
  data: PcbComplianceReportItemDto[];
  totals: PcbComplianceReportTotalsDto;
}

