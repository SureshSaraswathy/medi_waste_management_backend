import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisposalRegisterController } from './presentation/disposal-register.controller';
import { DisposalRegisterService } from './disposal-register.service';
import { DisposalRegisterRepository } from './infrastructure/persistence/disposal-register.repository';
import { DisposalRegisterEntity } from './infrastructure/transaction/disposal-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DisposalRegisterEntity], 'transaction'),
  ],
  controllers: [DisposalRegisterController],
  providers: [DisposalRegisterService, DisposalRegisterRepository],
  exports: [DisposalRegisterService],
})
export class DisposalRegisterModule {}
