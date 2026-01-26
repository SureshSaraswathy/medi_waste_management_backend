import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

// Infrastructure
import { UserEntity } from './infrastructure/persistence/user.entity';
import { UserEmployeeProfileEntity } from './infrastructure/persistence/user-employee-profile.entity';
import { UserIdentityComplianceEntity } from './infrastructure/persistence/user-identity-compliance.entity';
import { UserAddressEntity } from './infrastructure/persistence/user-address.entity';
import { UserRepository } from './infrastructure/persistence/user.repository';

// Application - Use Cases
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { CreateCompleteUserUseCase } from './application/use-cases/create-complete-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { GetUserByUsernameUseCase } from './application/use-cases/get-user-by-username.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateCompleteUserUseCase } from './application/use-cases/update-complete-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { ActivateUserUseCase } from './application/use-cases/activate-user.use-case';
import { ActivateUserWithPasswordUseCase } from './application/use-cases/activate-user-with-password.use-case';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case';
import { GetUsersByCompanyUseCase } from './application/use-cases/get-users-by-company.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { AdminResetPasswordUseCase } from './application/use-cases/admin-reset-password.use-case';

// Application - Services
import { PasswordService } from './application/services/password.service';

// Presentation
import { UserController } from './presentation/user.controller';
import { AuditLogInterceptor } from './presentation/interceptors/audit-log.interceptor';

// Domain
import { USER_REPOSITORY_TOKEN } from './domain/interfaces/user.repository.interface';

/**
 * User Module - Clean Architecture Structure
 * 
 * Layers:
 * - Domain: Entities, Interfaces, Exceptions (no framework deps)
 * - Application: Use Cases, DTOs
 * - Infrastructure: TypeORM Entity, Repository Implementation
 * - Presentation: Controller, Interceptors
 */
@Module({
  imports: [
    TypeOrmModule.forFeature(
      [UserEntity, UserEmployeeProfileEntity, UserIdentityComplianceEntity, UserAddressEntity],
      'master',
    ), // Infrastructure - Use master DB
    forwardRef(() => AuthModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [UserController], // Presentation
  providers: [
    // Infrastructure - Repository Implementation
    UserRepository,
    
    // Bind repository interface to implementation
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },

    // Application - Services
    PasswordService,

    // Application - Use Cases
    CreateUserUseCase,
    CreateCompleteUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    UpdateCompleteUserUseCase,
    DeleteUserUseCase,
    ActivateUserUseCase,
    ActivateUserWithPasswordUseCase,
    DeactivateUserUseCase,
    GetUsersByCompanyUseCase,
    GetUserByUsernameUseCase,
    ChangePasswordUseCase,
    AdminResetPasswordUseCase,

    // Presentation - Interceptors
    AuditLogInterceptor,
  ],
  exports: [
    // Export use cases if needed by other modules
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    // Export repository interface token
    USER_REPOSITORY_TOKEN,
    // Export PasswordService for auth module
    PasswordService,
  ],
})
export class UserModule {}
