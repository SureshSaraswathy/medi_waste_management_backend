import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceBulkDownloadService } from './invoice-bulk-download.service';

@Injectable()
export class BulkDownloadCleanupService {
  private readonly logger = new Logger(BulkDownloadCleanupService.name);

  constructor(private readonly bulkDownloadService: InvoiceBulkDownloadService) {}

  // Hourly cleanup: remove expired files and DB records (24h TTL).
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredBulkDownloads(): Promise<void> {
    const result = await this.bulkDownloadService.cleanupExpiredEntries();
    if (result.removedFiles > 0 || result.removedRecords > 0) {
      this.logger.log(
        `Bulk download cleanup removed ${result.removedFiles} file(s) and ${result.removedRecords} record(s)`,
      );
    }
  }
}

