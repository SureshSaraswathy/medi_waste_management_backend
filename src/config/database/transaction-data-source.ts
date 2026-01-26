import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

// Transaction Database Data Source (for migrations)
export const transactionDataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.TRANSACTION_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.TRANSACTION_DB_PORT || process.env.DB_PORT || '5432', 10),
  username: process.env.TRANSACTION_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.TRANSACTION_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  database: process.env.TRANSACTION_DB_DATABASE || 'medi_waste_management_transaction',
  entities: [join(__dirname, '../../modules/**/transaction/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../../database/migrations/transaction/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.TRANSACTION_DB_LOGGING === 'true',
};

export const TransactionDataSource = new DataSource(transactionDataSourceConfig);
