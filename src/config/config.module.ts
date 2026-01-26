import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig, {
  masterDatabaseConfig,
  transactionDatabaseConfig,
  reportDatabaseConfig,
} from './database.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig, // Legacy single DB config
        masterDatabaseConfig,
        transactionDatabaseConfig,
        reportDatabaseConfig,
      ],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
