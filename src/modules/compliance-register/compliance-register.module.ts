import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceRegisterController } from './presentation/compliance-register.controller';
import { ComplianceRegisterService } from './compliance-register.service';
import { ComplianceRegisterRepository } from './infrastructure/persistence/compliance-register.repository';
import { ComplianceRegisterEntity } from './infrastructure/transaction/compliance-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceRegisterEntity], 'transaction'),
  ],
  controllers: [ComplianceRegisterController],
  providers: [ComplianceRegisterService, ComplianceRegisterRepository],
  exports: [ComplianceRegisterService],
})
export class ComplianceRegisterModule {}
