import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

/**
 * QueueModule
 * Central BullMQ/Redis queue configuration.
 *
 * Env:
 * - REDIS_HOST
 * - REDIS_PORT
 */
@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'invoice-queue',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

