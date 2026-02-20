import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HcfModule } from '../hcf/hcf.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { HCFAuthController } from './presentation/hcf-auth.controller';
import { HCFLoginUseCase } from './application/use-cases/hcf-login.use-case';
import { AdminResetHCFPasswordUseCase } from './application/use-cases/admin-reset-hcf-password.use-case';
import { RequestHCFPasswordResetUseCase } from './application/use-cases/request-hcf-password-reset.use-case';
import { ResetHCFPasswordWithTokenUseCase } from './application/use-cases/reset-hcf-password-with-token.use-case';
import { ChangeHCFPasswordUseCase } from './application/use-cases/change-hcf-password.use-case';
import { HCFTokenService } from './application/services/hcf-token.service';
import { PasswordService } from '../user/application/services/password.service';

@Module({
  imports: [
    forwardRef(() => HcfModule), // Use forwardRef to avoid circular dependency
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
  ],
  controllers: [HCFAuthController],
  providers: [
    HCFLoginUseCase,
    AdminResetHCFPasswordUseCase,
    RequestHCFPasswordResetUseCase,
    ResetHCFPasswordWithTokenUseCase,
    ChangeHCFPasswordUseCase,
    HCFTokenService,
    PasswordService,
  ],
  exports: [
    HCFLoginUseCase,
    AdminResetHCFPasswordUseCase,
    RequestHCFPasswordResetUseCase,
    ResetHCFPasswordWithTokenUseCase,
    ChangeHCFPasswordUseCase,
  ],
})
export class HCFAuthModule {}
