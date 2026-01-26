import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteController } from './presentation/route.controller';
import { RouteRepository } from './infrastructure/persistence/route.repository';
import { RouteEntity } from './infrastructure/persistence/route.entity';
import { CreateRouteUseCase } from './application/use-cases/create-route.use-case';
import { GetRouteUseCase } from './application/use-cases/get-route.use-case';
import { GetAllRoutesUseCase } from './application/use-cases/get-all-routes.use-case';
import { UpdateRouteUseCase } from './application/use-cases/update-route.use-case';
import { DeleteRouteUseCase } from './application/use-cases/delete-route.use-case';
import { ROUTE_REPOSITORY_TOKEN } from './domain/interfaces/route.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([RouteEntity], 'master')],
  controllers: [RouteController],
  providers: [
    {
      provide: ROUTE_REPOSITORY_TOKEN,
      useClass: RouteRepository,
    },
    CreateRouteUseCase,
    GetRouteUseCase,
    GetAllRoutesUseCase,
    UpdateRouteUseCase,
    DeleteRouteUseCase,
  ],
  exports: [ROUTE_REPOSITORY_TOKEN],
})
export class RouteModule {}
