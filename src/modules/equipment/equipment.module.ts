import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentController } from './presentation/equipment.controller';
import { EquipmentRepository } from './infrastructure/persistence/equipment.repository';
import { EquipmentEntity } from './infrastructure/persistence/equipment.entity';
import { CreateEquipmentUseCase } from './application/use-cases/create-equipment.use-case';
import { GetEquipmentUseCase } from './application/use-cases/get-equipment.use-case';
import { GetAllEquipmentUseCase } from './application/use-cases/get-all-equipment.use-case';
import { UpdateEquipmentUseCase } from './application/use-cases/update-equipment.use-case';
import { DeleteEquipmentUseCase } from './application/use-cases/delete-equipment.use-case';
import { EQUIPMENT_REPOSITORY_TOKEN } from './domain/interfaces/equipment.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentEntity], 'master')],
  controllers: [EquipmentController],
  providers: [
    {
      provide: EQUIPMENT_REPOSITORY_TOKEN,
      useClass: EquipmentRepository,
    },
    CreateEquipmentUseCase,
    GetEquipmentUseCase,
    GetAllEquipmentUseCase,
    UpdateEquipmentUseCase,
    DeleteEquipmentUseCase,
  ],
  exports: [EQUIPMENT_REPOSITORY_TOKEN],
})
export class EquipmentModule {}
