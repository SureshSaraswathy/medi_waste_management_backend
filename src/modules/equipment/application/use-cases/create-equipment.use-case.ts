import { Injectable, Inject } from '@nestjs/common';
import { IEquipmentRepository, EQUIPMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/equipment.repository.interface';
import { Equipment } from '../../domain/entities/equipment.domain.entity';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import {
  DuplicateEquipmentCodeException,
} from '../../domain/exceptions/equipment.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateEquipmentUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY_TOKEN)
    private readonly equipmentRepository: IEquipmentRepository,
  ) {}

  async execute(createEquipmentDto: CreateEquipmentDto, createdBy?: string): Promise<Equipment> {
    // Check for duplicate equipment code
    const existingByCode = await this.equipmentRepository.findByEquipmentCode(createEquipmentDto.equipmentCode);
    if (existingByCode) {
      throw new DuplicateEquipmentCodeException(createEquipmentDto.equipmentCode);
    }

    // Create domain entity
    const equipment = Equipment.create({
      equipmentId: randomUUID(),
      companyId: createEquipmentDto.companyId,
      equipmentCode: createEquipmentDto.equipmentCode,
      equipmentName: createEquipmentDto.equipmentName,
      equipmentType: createEquipmentDto.equipmentType,
      make: createEquipmentDto.make,
      capacity: createEquipmentDto.capacity,
      createdBy: createdBy || null,
    });

    // Persist through repository
    return this.equipmentRepository.create(equipment);
  }
}
