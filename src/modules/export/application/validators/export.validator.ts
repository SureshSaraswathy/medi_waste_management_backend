import { Injectable, BadRequestException } from '@nestjs/common';
import { ExportRequestDto, ExportFileType } from '../dto/export-request.dto';

@Injectable()
export class ExportValidator {
  private readonly MAX_DATE_RANGE_DAYS = 365; // 1 year max
  private readonly MAX_RECORDS_FOR_SYNC = 10000; // Sync export limit

  /**
   * Validate common export requirements
   * Stops immediately if validation fails (no DB call, no file generation)
   */
  validateCommonRequirements(dto: ExportRequestDto): void {
    // 1. Date From & Date To required
    if (!dto.dateFrom || !dto.dateTo) {
      throw new BadRequestException('Date From and Date To are required');
    }

    // 2. Validate date format and range
    const dateFrom = new Date(dto.dateFrom);
    const dateTo = new Date(dto.dateTo);

    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    if (dateFrom > dateTo) {
      throw new BadRequestException('Date From must be before or equal to Date To');
    }

    // 3. Max date range limit
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > this.MAX_DATE_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range cannot exceed ${this.MAX_DATE_RANGE_DAYS} days. Selected range: ${daysDiff} days`,
      );
    }

    // 4. At least one filter mandatory (besides dates)
    const hasFilters =
      !!dto.companyId ||
      !!dto.hcfId ||
      !!dto.status ||
      !!dto.search ||
      (dto.additionalFilters && dto.additionalFilters.length > 0);

    if (!hasFilters) {
      throw new BadRequestException(
        'At least one filter is required (Company, HCF, Status, or Search)',
      );
    }

    // 5. File type must be PDF or Excel
    if (!Object.values(ExportFileType).includes(dto.fileType)) {
      throw new BadRequestException(`File type must be ${ExportFileType.PDF} or ${ExportFileType.EXCEL}`);
    }
  }

  /**
   * Check if export should be async based on estimated record count
   */
  shouldUseAsyncExport(estimatedRecordCount: number): boolean {
    return estimatedRecordCount > this.MAX_RECORDS_FOR_SYNC;
  }

  /**
   * Get max date range in days
   */
  getMaxDateRangeDays(): number {
    return this.MAX_DATE_RANGE_DAYS;
  }

  /**
   * Get max records for sync export
   */
  getMaxRecordsForSync(): number {
    return this.MAX_RECORDS_FOR_SYNC;
  }
}
