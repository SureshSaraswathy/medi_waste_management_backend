import { Injectable, Logger } from '@nestjs/common';
import { ExportRequestDto } from '../dto/export-request.dto';

interface ExportAuditLog {
  module: string;
  userId: string;
  filters: ExportRequestDto;
  recordCount: number;
  fileType: string;
  fileName: string;
  timestamp: Date;
  duration?: number; // in milliseconds
  success: boolean;
  error?: string;
}

/**
 * Export Audit Service
 * Logs every export operation
 */
@Injectable()
export class ExportAuditService {
  private readonly logger = new Logger(ExportAuditService.name);

  /**
   * Log export operation
   */
  async logExport(logData: {
    module: string;
    userId: string;
    filters: ExportRequestDto;
    recordCount: number;
    fileType: string;
    fileName: string;
    duration?: number;
    success?: boolean;
    error?: string;
  }): Promise<void> {
    const auditLog: ExportAuditLog = {
      module: logData.module,
      userId: logData.userId,
      filters: logData.filters,
      recordCount: logData.recordCount,
      fileType: logData.fileType,
      fileName: logData.fileName,
      timestamp: new Date(),
      duration: logData.duration,
      success: logData.success !== false,
      error: logData.error,
    };

    // Log to console (in production, save to database)
    this.logger.log(
      `[EXPORT AUDIT] Module: ${auditLog.module} | User: ${auditLog.userId} | Records: ${auditLog.recordCount} | File: ${auditLog.fileName} | Type: ${auditLog.fileType} | Duration: ${auditLog.duration || 'N/A'}ms`,
    );

    // In production, save to audit_logs table:
    // await this.auditRepository.save({
    //   action: 'EXPORT',
    //   module: auditLog.module,
    //   userId: auditLog.userId,
    //   details: JSON.stringify(auditLog),
    //   timestamp: auditLog.timestamp,
    // });
  }
}
