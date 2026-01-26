import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteAssignmentController } from './presentation/route-assignment.controller';
import { RouteAssignmentRepository } from './infrastructure/persistence/route-assignment.repository';
import { RouteAssignmentEntity } from './infrastructure/transaction/route-assignment.entity';
import { CreateRouteAssignmentUseCase } from './application/use-cases/create-route-assignment.use-case';
import { GetRouteAssignmentUseCase } from './application/use-cases/get-route-assignment.use-case';
import { GetAllRouteAssignmentsUseCase } from './application/use-cases/get-all-route-assignments.use-case';
import { UpdateRouteAssignmentUseCase } from './application/use-cases/update-route-assignment.use-case';
import { DeleteRouteAssignmentUseCase } from './application/use-cases/delete-route-assignment.use-case';
import { ROUTE_ASSIGNMENT_REPOSITORY_TOKEN } from './domain/interfaces/route-assignment.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([RouteAssignmentEntity], 'transaction')],
  controllers: [RouteAssignmentController],
  providers: [
    {
      provide: ROUTE_ASSIGNMENT_REPOSITORY_TOKEN,
      useClass: RouteAssignmentRepository,
    },
    CreateRouteAssignmentUseCase,
    GetRouteAssignmentUseCase,
    GetAllRouteAssignmentsUseCase,
    UpdateRouteAssignmentUseCase,
    DeleteRouteAssignmentUseCase,
  ],
  exports: [ROUTE_ASSIGNMENT_REPOSITORY_TOKEN],
})
export class RouteAssignmentModule {}
