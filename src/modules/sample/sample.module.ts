import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';
import { SampleRepository } from './sample.repository';
import { Sample } from './sample.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sample], 'master')], // Specify 'master' connection
  controllers: [SampleController],
  providers: [SampleService, SampleRepository],
  exports: [SampleService, SampleRepository],
})
export class SampleModule {}
