export interface OperatorPcbReportRowDto {
  date: string;
  noOfHce: number;
  collectedYellowKg: number;
  collectedRwbKg: number;
  treatedYellowKg: number;
  treatedRwbKg: number;
}

export interface OperatorPcbReportResponseDto {
  header: {
    fromDate: string;
    toDate: string;
    option: string;
  };
  data: OperatorPcbReportRowDto[];
  totals: {
    totalHce: number;
    totalCollectedYellowKg: number;
    totalCollectedRwbKg: number;
    totalTreatedYellowKg: number;
    totalTreatedRwbKg: number;
  };
}

