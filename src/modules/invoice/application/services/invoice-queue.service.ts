import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface BulkInvoiceJobPayload {
  invoiceIds: string[];
  email: string;
}

@Injectable()
export class InvoiceQueueService {
  constructor(
    @InjectQueue('invoice-queue')
    private readonly invoiceQueue: Queue,
  ) {}

  async addBulkJob(invoiceIds: string[], email: string): Promise<{ jobId: string }> {
    const job = await this.invoiceQueue.add(
      'generate-bulk-invoice',
      { invoiceIds, email } satisfies BulkInvoiceJobPayload,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { jobId: String(job.id) };
  }
}

