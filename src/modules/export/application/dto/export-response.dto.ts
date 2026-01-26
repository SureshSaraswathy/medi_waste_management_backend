export class ExportResponseDto {
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
  recordCount?: number;
  exportId?: string; // For async exports
  estimatedTime?: number; // For async exports (in seconds)
}
