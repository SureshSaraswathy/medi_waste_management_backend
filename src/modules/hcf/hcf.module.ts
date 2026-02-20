import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HcfController } from './presentation/hcf.controller';
import { HcfRepository } from './infrastructure/persistence/hcf.repository';
import { HcfEntity } from './infrastructure/persistence/hcf.entity';
import { CreateHcfUseCase } from './application/use-cases/create-hcf.use-case';
import { GetHcfUseCase } from './application/use-cases/get-hcf.use-case';
import { GetAllHcfsUseCase } from './application/use-cases/get-all-hcfs.use-case';
import { UpdateHcfUseCase } from './application/use-cases/update-hcf.use-case';
import { DeleteHcfUseCase } from './application/use-cases/delete-hcf.use-case';
import { HCF_REPOSITORY_TOKEN } from './domain/interfaces/hcf.repository.interface';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HcfEntity], 'master'),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [HcfController],
  providers: [
    {
      provide: HCF_REPOSITORY_TOKEN,
      useClass: HcfRepository,
    },
    CreateHcfUseCase,
    GetHcfUseCase,
    GetAllHcfsUseCase,
    UpdateHcfUseCase,
    DeleteHcfUseCase,
  ],
  exports: [HCF_REPOSITORY_TOKEN],
})
export class HcfModule {}
