import { Controller, Get, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { InvoiceBulkDownloadService } from '../application/services/invoice-bulk-download.service';
import { EntitlementService } from '../../entitlement/application/entitlement.service';

/**
 * Public download endpoint for bulk invoice ZIPs.
 * Uses an unguessable token + expiry to avoid requiring auth in email links.
 */
@Controller()
export class InvoiceDownloadController {
  constructor(
    private readonly bulkDownloadService: InvoiceBulkDownloadService,
    private readonly entitlements: EntitlementService,
  ) {}

  @Get(['download/bulk/:token', 'invoice-downloads/:token'])
  async download(@Param('token') token: string, @Res() res: Response, @Req() req?: Request) {
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

    // Ownership is established at download time, every time. Recorded owner, or (legacy rows) the single company that
    // all invoices listed in the ZIP's manifest belong to. If it cannot be established safely the link is refused
    // (nothing is deleted; a platform administrator can still identify themselves with a Bearer token).
    const owner = await this.bulkDownloadService.resolveOwner(meta);
    if (!owner.established) {
      const admin = await this.entitlements.isPlatformAdminBearer(req?.headers?.authorization);
      if (!admin) {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          code: 'DOWNLOAD_OWNER_UNVERIFIED',
          message: 'This download link cannot be verified for your organisation. Please request a new download.',
        });
      }
    }

    // A link must not outlive the customer's right to use it: re-check the entitlement every time it is used.
    if (owner.established && await this.entitlements.shouldDenyDownload(owner.companyId, ['FINANCE.INVOICE_MGMT.BULK_ZIP'], '/download/bulk/:token')) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        code: 'FEATURE_NOT_LICENSED',
        message: 'Bulk invoice downloads are not included in your plan.',
      });
    }

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

