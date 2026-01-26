import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

// Infrastructure
import { RoleEntity } from './infrastructure/persistence/role.entity';
import { RoleRepository } from './infrastructure/persistence/role.repository';

// Domain
import { ROLE_REPOSITORY_TOKEN } from './domain/interfaces/role.repository.interface';

// Application - Use Cases
import { CreateRoleUseCase } from './application/use-cases/create-role.use-case';
import { GetRoleUseCase } from './application/use-cases/get-role.use-case';
import { GetAllRolesUseCase } from './application/use-cases/get-all-roles.use-case';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from './application/use-cases/delete-role.use-case';

// Presentation
import { RoleController } from './presentation/role.controller';

/**
 * Role Module - Clean Architecture Structure
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity], 'master'),
    AuthModule,
  ],
  controllers: [RoleController],
  providers: [
    RoleRepository,
    {
      provide: ROLE_REPOSITORY_TOKEN,
      useClass: RoleRepository,
    },
    CreateRoleUseCase,
    GetRoleUseCase,
    GetAllRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
  ],
  exports: [
    ROLE_REPOSITORY_TOKEN,
  ],
})
export class RoleModule {}
