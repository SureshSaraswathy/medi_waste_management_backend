import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShredderRegisterController } from './presentation/shredder-register.controller';
import { ShredderRegisterService } from './shredder-register.service';
import { ShredderRegisterRepository } from './infrastructure/persistence/shredder-register.repository';
import { ShredderRegisterEntity } from './infrastructure/transaction/shredder-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShredderRegisterEntity], 'transaction'),
  ],
  controllers: [ShredderRegisterController],
  providers: [ShredderRegisterService, ShredderRegisterRepository],
  exports: [ShredderRegisterService],
})
export class ShredderRegisterModule {}
