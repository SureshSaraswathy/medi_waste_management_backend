import { Module } from '@nestjs/common';
import { AppModule } from './app.module';
import { InvoiceProcessor } from './modules/invoice/application/queue/invoice.processor';

/**
 * WorkerModule
 * Imports the full AppModule (so DB/config/etc are available),
 * and adds BullMQ processors that must NOT run in the HTTP API process.
 */
@Module({
  imports: [AppModule],
  providers: [InvoiceProcessor],
})
export class WorkerModule {}

