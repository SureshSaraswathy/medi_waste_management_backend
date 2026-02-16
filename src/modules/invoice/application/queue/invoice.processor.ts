import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InvoicePdfService } from '../services/invoice-pdf.service';
import { InvoiceBulkDownloadService } from '../services/invoice-bulk-download.service';
import { EmailService } from '../../../auth/services/email.service';
import { ZipGenerator, ZipFileEntry } from '../../../../common/utils/zip-generator.util';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { Inject } from '@nestjs/common';

type BulkJobData = {
  invoiceIds: string[];
  email: string;
};

@Processor('invoice-queue', { concurrency: 2 })
export class InvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(
    private readonly invoicePdfService: InvoicePdfService,
    private readonly bulkDownloadService: InvoiceBulkDownloadService,
    private readonly emailService: EmailService,
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
  ) {
    super();
  }

  async process(job: Job<BulkJobData>) {
    if (job.name !== 'generate-bulk-invoice') {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const { invoiceIds, email } = job.data;
    const total = invoiceIds.length;

    this.logger.log(`Job ${job.id}: generating bulk invoice PDFs for ${total} invoices`);
    await job.updateProgress(1);

    const zipFiles: ZipFileEntry[] = [];

    for (let i = 0; i < invoiceIds.length; i++) {
      const invoiceId = invoiceIds[i];

      // Sequential generation (requirement)
      const invoice = await this.invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      const pdfBuffer = (await this.invoicePdfService.generateInvoicePdf(invoiceId)) as Buffer;
      const fileName = `${invoice.invoiceNumber}.pdf`;

      zipFiles.push({ name: fileName, buffer: pdfBuffer });

      const progress = 5 + Math.round(((i + 1) / total) * 80);
      await job.updateProgress(progress);
    }

    await job.updateProgress(90);

    const zipBuffer = await ZipGenerator.generateZipFromBuffers(zipFiles, {
      includeManifest: true,
      compressionLevel: 6,
    });

    const meta = await this.bulkDownloadService.saveZip({
      jobId: String(job.id),
      email,
      buffer: zipBuffer,
      fileName: `invoices-${job.id}.zip`,
    });

    const baseUrl =
      process.env.APP_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || '3000'}`;

    const downloadUrl = `${baseUrl}/api/v1/invoice-downloads/${meta.token}`;

    await job.updateProgress(95);

    await this.emailService.sendBulkInvoiceZipEmail({
      to: email,
      downloadUrl,
      invoiceCount: total,
      expiresAt: meta.expiresAt,
    });

    await job.updateProgress(100);

    this.logger.log(`Job ${job.id}: bulk invoice ZIP ready. Stored at ${meta.filePath}`);
    return {
      downloadUrl,
      expiresAt: meta.expiresAt,
      fileName: meta.fileName,
    };
  }
}

