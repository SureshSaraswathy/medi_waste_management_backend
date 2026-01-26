import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

// Infrastructure
import { PermissionEntity } from './infrastructure/persistence/permission.entity';
import { RolePermissionEntity } from './infrastructure/persistence/role-permission.entity';
import { RoleEntity } from '../role/infrastructure/persistence/role.entity';

/**
 * Permission Module - Clean Architecture Structure
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionEntity, RolePermissionEntity, RoleEntity], 'master'),
    AuthModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PermissionModule {}
