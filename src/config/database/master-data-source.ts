import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

// Master Database Data Source (for migrations)
export const masterDataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
  username: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  database: process.env.MASTER_DB_DATABASE || 'medi_waste_management_master',
  entities: [
    join(__dirname, '../../modules/**/infrastructure/persistence/*.entity{.ts,.js}'),
    join(__dirname, '../../modules/**/master/**/*.entity{.ts,.js}'),
  ],
  migrations: [join(__dirname, '../../database/migrations/master/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.MASTER_DB_LOGGING === 'true',
};

export const MasterDataSource = new DataSource(masterDataSourceConfig);
