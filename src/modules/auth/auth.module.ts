import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { HcfModule } from '../hcf/hcf.module';
import { PermissionsGuard } from './guards/permissions.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionService } from './services/permission.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';
import { AuthJwtService } from './services/jwt.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './presentation/auth.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { PasswordService } from '../user/application/services/password.service';
import { RolePermissionEntity } from '../permission/infrastructure/persistence/role-permission.entity';
import { PermissionEntity } from '../permission/infrastructure/persistence/permission.entity';
import { UserEntity } from '../user/infrastructure/persistence/user.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature(
      [RolePermissionEntity, PermissionEntity, UserEntity],
      'master',
    ),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.get('app.jwt');
        return {
          secret: jwtConfig.secret,
          signOptions: {
            expiresIn: jwtConfig.expiresIn,
          },
        };
      },
    }),
    forwardRef(() => UserModule), // Use forwardRef to avoid circular dependency
    forwardRef(() => HcfModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [AuthController],
  providers: [
    PermissionsGuard,
    JwtAuthGuard,
    PermissionService,
    EmailService,
    OtpService,
    AuthJwtService,
    JwtStrategy,
    LoginUseCase,
    PasswordService,
  ],
  exports: [
    PermissionsGuard,
    JwtAuthGuard,
    PermissionService,
    EmailService,
    OtpService,
    AuthJwtService,
    JwtModule,
  ],
})
export class AuthModule {}
