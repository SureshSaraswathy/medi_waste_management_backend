import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../modules/user/infrastructure/persistence/user.entity';
import { UserEmployeeProfileEntity } from '../modules/user/infrastructure/persistence/user-employee-profile.entity';
import { UserIdentityComplianceEntity } from '../modules/user/infrastructure/persistence/user-identity-compliance.entity';
import { UserAddressEntity } from '../modules/user/infrastructure/persistence/user-address.entity';
import { CompanyEntity } from '../modules/company/infrastructure/persistence/company.entity';
import { RoleEntity } from '../modules/role/infrastructure/persistence/role.entity';
import { PermissionEntity } from '../modules/permission/infrastructure/persistence/permission.entity';
import { RolePermissionEntity } from '../modules/permission/infrastructure/persistence/role-permission.entity';
import { StateEntity } from '../modules/state/infrastructure/persistence/state.entity';
import { AreaEntity } from '../modules/area/infrastructure/persistence/area.entity';
import { ColorEntity } from '../modules/color/infrastructure/persistence/color.entity';
import { PcbZoneEntity } from '../modules/pcb-zone/infrastructure/persistence/pcb-zone.entity';
import { CategoryEntity } from '../modules/category/infrastructure/persistence/category.entity';
import { FrequencyEntity } from '../modules/frequency/infrastructure/persistence/frequency.entity';
import { HcfTypeEntity } from '../modules/hcf-type/infrastructure/persistence/hcf-type.entity';
import { RouteEntity } from '../modules/route/infrastructure/persistence/route.entity';
import { FleetEntity } from '../modules/fleet/infrastructure/persistence/fleet.entity';
import { RouteHcfEntity } from '../modules/route-hcf/infrastructure/persistence/route-hcf.entity';
import { HcfAmendmentEntity } from '../modules/hcf-amendment/infrastructure/persistence/hcf-amendment.entity';
import { HcfEntity } from '../modules/hcf/infrastructure/persistence/hcf.entity';
import { TrainingCertificateEntity } from '../modules/training-certificate/infrastructure/transaction/training-certificate.entity';
import { ContractEntity } from '../modules/contract/infrastructure/transaction/contract.entity';
import { AgreementEntity } from '../modules/agreement/infrastructure/transaction/agreement.entity';
import { AgreementClauseEntity } from '../modules/agreement-clause/infrastructure/transaction/agreement-clause.entity';
import { RouteAssignmentEntity } from '../modules/route-assignment/infrastructure/transaction/route-assignment.entity';
import { WasteCollectionEntity } from '../modules/waste-collection/infrastructure/transaction/waste-collection.entity';
import { BarcodeLabelEntity } from '../modules/barcode-label/infrastructure/transaction/barcode-label.entity';
import { WasteTransactionEntity } from '../modules/waste-transaction/infrastructure/transaction/waste-transaction.entity';
import { VehicleWasteCollectionEntity } from '../modules/vehicle-waste-collection/infrastructure/transaction/vehicle-waste-collection.entity';
import { WasteProcessEntity } from '../modules/waste-process/infrastructure/transaction/waste-process.entity';
import { InvoiceEntity } from '../modules/invoice/infrastructure/transaction/invoice.entity';

// Master Database Config - For reference/master data
export const masterDatabaseConfig = registerAs(
  'masterDatabase',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.MASTER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.MASTER_DB_DATABASE || 'medi_waste_management_master',
    entities: [
      // Explicitly import entities to ensure TypeORM can find them
      UserEntity,
      UserEmployeeProfileEntity,
      UserIdentityComplianceEntity,
      UserAddressEntity,
      CompanyEntity,
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      StateEntity,
      AreaEntity,
      ColorEntity,
      PcbZoneEntity,
      CategoryEntity,
      FrequencyEntity,
      HcfTypeEntity,
      RouteEntity,
      FleetEntity,
      RouteHcfEntity,
      HcfAmendmentEntity,
      HcfEntity,
      // Also include glob patterns as fallback
      __dirname + '/../modules/**/infrastructure/persistence/*.entity{.ts,.js}',
    ],
    synchronize: process.env.MASTER_DB_SYNCHRONIZE === 'true',
    logging: process.env.MASTER_DB_LOGGING === 'true',
    migrations: [__dirname + '/../database/migrations/master/*{.ts,.js}'],
    migrationsRun: false,
    name: 'master', // Connection name for TypeORM
  }),
);

// Transaction Database Config - For operational/transactional data
export const transactionDatabaseConfig = registerAs(
  'transactionDatabase',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.TRANSACTION_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TRANSACTION_DB_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.TRANSACTION_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.TRANSACTION_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.TRANSACTION_DB_DATABASE || 'medi_waste_management_transaction',
    entities: [
      // Explicitly import transaction entities
      TrainingCertificateEntity,
      ContractEntity,
      AgreementEntity,
      AgreementClauseEntity,
      RouteAssignmentEntity,
      WasteCollectionEntity,
      BarcodeLabelEntity,
      WasteTransactionEntity,
      VehicleWasteCollectionEntity,
      WasteProcessEntity,
      InvoiceEntity,
      // Also include glob patterns as fallback
      __dirname + '/../modules/**/transaction/**/*.entity{.ts,.js}',
      __dirname + '/../modules/**/infrastructure/transaction/**/*.entity{.ts,.js}',
    ],
    synchronize: process.env.TRANSACTION_DB_SYNCHRONIZE === 'true',
    logging: process.env.TRANSACTION_DB_LOGGING === 'true',
    migrations: [__dirname + '/../database/migrations/transaction/*{.ts,.js}'],
    migrationsRun: false,
    name: 'transaction', // Connection name for TypeORM
  }),
);

// Report Database Config - For reporting/analytics data
export const reportDatabaseConfig = registerAs(
  'reportDatabase',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.REPORT_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.REPORT_DB_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.REPORT_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.REPORT_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.REPORT_DB_DATABASE || 'medi_waste_management_report',
    entities: [__dirname + '/../modules/**/report/**/*.entity{.ts,.js}'],
    synchronize: process.env.REPORT_DB_SYNCHRONIZE === 'true',
    logging: process.env.REPORT_DB_LOGGING === 'true',
    migrations: [__dirname + '/../database/migrations/report/*{.ts,.js}'],
    migrationsRun: false,
    name: 'report', // Connection name for TypeORM
  }),
);

// Legacy single database config (for backward compatibility)
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'medi_waste_management',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  }),
);
