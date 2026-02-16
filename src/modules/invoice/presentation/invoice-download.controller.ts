import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { InvoiceBulkDownloadService } from '../application/services/invoice-bulk-download.service';

/**
 * Public download endpoint for bulk invoice ZIPs.
 * Uses an unguessable token + expiry to avoid requiring auth in email links.
 */
@Controller('invoice-downloads')
export class InvoiceDownloadController {
  constructor(private readonly bulkDownloadService: InvoiceBulkDownloadService) {}

  @Get(':token')
  async download(@Param('token') token: string, @Res() res: Response) {
    const meta = await this.bulkDownloadService.getByToken(token);
    if (!meta) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Download link is invalid or expired',
      });
    }

    if (!fs.existsSync(meta.filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'File not found (may have been removed)',
      });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.fileName}"`);

    const stream = fs.createReadStream(meta.filePath);
    stream.pipe(res);
  }
}

