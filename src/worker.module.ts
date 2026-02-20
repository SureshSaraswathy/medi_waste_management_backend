import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { QueueModule } from './modules/queue/queue.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { AuthModule } from './modules/auth/auth.module';
import { InvoiceProcessor } from './modules/invoice/application/queue/invoice.processor';

/**
 * WorkerModule
 * Boots NestJS application context WITHOUT HTTP server.
 * Only runs BullMQ processors (background jobs).
 *
 * Imports:
 * - ConfigModule: Environment variables
 * - TypeOrmModule: Database connections (master, transaction, report)
 * - QueueModule: BullMQ/Redis configuration
 * - InvoiceModule: Provides InvoicePdfService, InvoiceBulkDownloadService, INVOICE_REPOSITORY_TOKEN
 * - AuthModule: Provides EmailService
 */
@Module({
  imports: [
    ConfigModule,
    QueueModule,
    // Database connections (same as AppModule)
    TypeOrmModule.forRootAsync({
      name: 'master',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('masterDatabase');
        if (!dbConfig) {
          throw new Error('Master database configuration is missing');
        }
        return dbConfig;
      },
    }),
    TypeOrmModule.forRootAsync({
      name: 'transaction',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('transactionDatabase');
        if (!dbConfig) {
          throw new Error('Transaction database configuration is missing');
        }
        return dbConfig;
      },
    }),
    TypeOrmModule.forRootAsync({
      name: 'report',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('reportDatabase');
        if (!dbConfig) {
          throw new Error('Report database configuration is missing');
        }
        return dbConfig;
      },
    }),
    // Modules that provide services needed by processors
    InvoiceModule,
    AuthModule,
  ],
  providers: [InvoiceProcessor],
})
export class WorkerModule {}

