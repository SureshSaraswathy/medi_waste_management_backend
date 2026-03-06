import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
import { SampleModule } from './modules/sample/sample.module';
import { UserModule } from './modules/user/user.module';
import { CompanyModule } from './modules/company/company.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { StateModule } from './modules/state/state.module';
import { DistrictModule } from './modules/district/district.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { FinanceYearModule } from './modules/finance-year/finance-year.module';
import { AreaModule } from './modules/area/area.module';
import { ColorModule } from './modules/color/color.module';
import { PcbZoneModule } from './modules/pcb-zone/pcb-zone.module';
import { CategoryModule } from './modules/category/category.module';
import { FrequencyModule } from './modules/frequency/frequency.module';
import { HcfTypeModule } from './modules/hcf-type/hcf-type.module';
import { RouteModule } from './modules/route/route.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { RouteHcfModule } from './modules/route-hcf/route-hcf.module';
import { HcfAmendmentModule } from './modules/hcf-amendment/hcf-amendment.module';
import { HcfModule } from './modules/hcf/hcf.module';
import { HCFAuthModule } from './modules/hcf-auth/hcf-auth.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExportModule } from './modules/export/export.module';
import { TrainingCertificateModule } from './modules/training-certificate/training-certificate.module';
import { ContractModule } from './modules/contract/contract.module';
import { AgreementModule } from './modules/agreement/agreement.module';
import { AgreementClauseModule } from './modules/agreement-clause/agreement-clause.module';
import { RouteAssignmentModule } from './modules/route-assignment/route-assignment.module';
import { WasteCollectionModule } from './modules/waste-collection/waste-collection.module';
import { BarcodeLabelModule } from './modules/barcode-label/barcode-label.module';
import { WasteTransactionModule } from './modules/waste-transaction/waste-transaction.module';
import { VehicleWasteCollectionModule } from './modules/vehicle-waste-collection/vehicle-waste-collection.module';
import { WasteProcessModule } from './modules/waste-process/waste-process.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { FinBalanceModule } from './modules/fin-balance/fin-balance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IncidentRegisterModule } from './modules/incident-register/incident-register.module';
import { IncinerationRegisterModule } from './modules/incineration-register/incineration-register.module';
import { AutoclaveRegisterModule } from './modules/autoclave-register/autoclave-register.module';
import { ShredderRegisterModule } from './modules/shredder-register/shredder-register.module';
import { DisposalRegisterModule } from './modules/disposal-register/disposal-register.module';
import { EmissionRegisterModule } from './modules/emission-register/emission-register.module';
import { ETPRegisterModule } from './modules/etp-register/etp-register.module';
import { DowntimeRegisterModule } from './modules/downtime-register/downtime-register.module';
import { ComplianceRegisterModule } from './modules/compliance-register/compliance-register.module';
import { NotificationModule } from './modules/notification/notification.module';
import { QueueModule } from './modules/queue/queue.module';
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    ConfigModule,
    QueueModule,
    
    // Master Database Connection - For reference/master data
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
    
    // Transaction Database Connection - For operational/transactional data
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
    
    // Report Database Connection - For reporting/analytics data
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
    
    SampleModule,
    UserModule,
    AuthModule,
    CompanyModule,
    RoleModule,
    PermissionModule,
    StateModule,
    DistrictModule,
    EquipmentModule,
    FinanceYearModule,
    AreaModule,
    ColorModule,
    PcbZoneModule,
    CategoryModule,
    FrequencyModule,
    HcfTypeModule,
    RouteModule,
    FleetModule,
    RouteHcfModule,
    HcfAmendmentModule,
    HcfModule,
    HCFAuthModule,
    ExportModule,
    TrainingCertificateModule,
    ContractModule,
    AgreementModule,
    AgreementClauseModule,
    RouteAssignmentModule,
    WasteCollectionModule,
    BarcodeLabelModule,
    WasteTransactionModule,
    VehicleWasteCollectionModule,
    WasteProcessModule,
    InvoiceModule,
    PaymentModule,
    FinBalanceModule,
    ReportsModule,
    DashboardModule,
    IncidentRegisterModule,
    IncinerationRegisterModule,
    AutoclaveRegisterModule,
    ShredderRegisterModule,
    DisposalRegisterModule,
    EmissionRegisterModule,
    ETPRegisterModule,
    DowntimeRegisterModule,
    ComplianceRegisterModule,
    NotificationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
