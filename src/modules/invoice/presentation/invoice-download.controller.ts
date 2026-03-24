import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { InvoiceBulkDownloadService } from '../application/services/invoice-bulk-download.service';

/**
 * Public download endpoint for bulk invoice ZIPs.
 * Uses an unguessable token + expiry to avoid requiring auth in email links.
 */
@Controller()
export class InvoiceDownloadController {
  constructor(private readonly bulkDownloadService: InvoiceBulkDownloadService) {}

  @Get(['download/bulk/:token', 'invoice-downloads/:token'])
  async download(@Param('token') token: string, @Res() res: Response) {
    const validation = await this.bulkDownloadService.validateToken(token);
    if (validation.status === 'invalid') {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Invalid download token',
      });
    }

    if (validation.status === 'expired') {
      return res.status(HttpStatus.GONE).json({
        success: false,
        message: 'Download link has expired',
      });
    }

    if (validation.status === 'missing_file') {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'ZIP file is missing or already cleaned up',
      });
    }

    const meta = validation.record;

    if (!fs.existsSync(meta.filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'ZIP file is missing or already cleaned up',
      });
    }

    await this.bulkDownloadService.incrementDownloadCount(meta.id);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${validation.fileName}"`);

    const stream = fs.createReadStream(meta.filePath);
    stream.pipe(res);
  }
}

