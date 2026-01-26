import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteHcfController } from './presentation/route-hcf.controller';
import { RouteHcfRepository } from './infrastructure/persistence/route-hcf.repository';
import { RouteHcfEntity } from './infrastructure/persistence/route-hcf.entity';
import { CreateRouteHcfUseCase } from './application/use-cases/create-route-hcf.use-case';
import { GetRouteHcfUseCase } from './application/use-cases/get-route-hcf.use-case';
import { GetAllRouteHcfsUseCase } from './application/use-cases/get-all-route-hcfs.use-case';
import { UpdateRouteHcfUseCase } from './application/use-cases/update-route-hcf.use-case';
import { DeleteRouteHcfUseCase } from './application/use-cases/delete-route-hcf.use-case';
import { ROUTE_HCF_REPOSITORY_TOKEN } from './domain/interfaces/route-hcf.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([RouteHcfEntity], 'master')],
  controllers: [RouteHcfController],
  providers: [
    {
      provide: ROUTE_HCF_REPOSITORY_TOKEN,
      useClass: RouteHcfRepository,
    },
    CreateRouteHcfUseCase,
    GetRouteHcfUseCase,
    GetAllRouteHcfsUseCase,
    UpdateRouteHcfUseCase,
    DeleteRouteHcfUseCase,
  ],
  exports: [ROUTE_HCF_REPOSITORY_TOKEN],
})
export class RouteHcfModule {}
