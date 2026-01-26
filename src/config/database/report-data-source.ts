import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

// Report Database Data Source (for migrations)
export const reportDataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.REPORT_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.REPORT_DB_PORT || process.env.DB_PORT || '5432', 10),
  username: process.env.REPORT_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.REPORT_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  database: process.env.REPORT_DB_DATABASE || 'medi_waste_management_report',
  entities: [join(__dirname, '../../modules/**/report/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../../database/migrations/report/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.REPORT_DB_LOGGING === 'true',
};

export const ReportDataSource = new DataSource(reportDataSourceConfig);
