import { Global, Module } from '@nestjs/common';
import { CHANNEL_LOGIN_POLICY } from '../auth/application/channel-login-policy';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ENTITLEMENT_LISTEN_FACTORY, EntitlementService } from './application/entitlement.service';
import { PgListenConnection } from './infrastructure/entitlement-change-listener';
import { TenantOwnershipService } from './application/tenant-ownership.service';
import { EntitlementRepository } from './infrastructure/entitlement.repository';
import { EntitlementAdminController } from './presentation/entitlement-admin.controller';
import { EntitlementAdminGuard } from './presentation/entitlement-admin.guard';
import { EntitlementInterceptor } from './presentation/entitlement.interceptor';
import { EntitlementMeController } from './presentation/entitlement-me.controller';

/**
 * Customer Entitlements: SuperAdmin decides which modules, submodules and features each customer has bought.
 * Effective access always requires BOTH the customer entitlement AND the user's RBAC permission.
 * The global interceptor is inert (mode OFF) until a SuperAdmin switches it to SHADOW or ENFORCE.
 */
@Global() // the auth use cases reach CHANNEL_LOGIN_POLICY without importing this module (no import cycle)
@Module({
  imports: [AuthModule],
  controllers: [EntitlementAdminController, EntitlementMeController],
  providers: [
    EntitlementRepository,
    EntitlementService,
    {
      // dedicated LISTEN connection on the master database; ENTITLEMENT_LISTEN=false turns it off (TTL only)
      provide: ENTITLEMENT_LISTEN_FACTORY,
      inject: [getDataSourceToken('master')],
      useFactory: (ds: DataSource) => (process.env.ENTITLEMENT_LISTEN === 'false' ? null : () => new PgListenConnection(ds.options as any)),
    },
    { provide: CHANNEL_LOGIN_POLICY, useExisting: EntitlementService },
    TenantOwnershipService,
    EntitlementAdminGuard,
    { provide: APP_INTERCEPTOR, useClass: EntitlementInterceptor },
  ],
  exports: [EntitlementService, CHANNEL_LOGIN_POLICY],
})
export class EntitlementModule {}
