import { Injectable, Inject } from '@nestjs/common';
import { IEquipmentRepository, EQUIPMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/equipment.repository.interface';
import { Equipment } from '../../domain/entities/equipment.domain.entity';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { EquipmentNotFoundException } from '../../domain/exceptions/equipment.exceptions';

@Injectable()
export class UpdateEquipmentUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY_TOKEN)
    private readonly equipmentRepository: IEquipmentRepository,
  ) {}

  async execute(equipmentId: string, updateEquipmentDto: UpdateEquipmentDto, modifiedBy?: string): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundException(equipmentId);
    }

    // Update equipment
    equipment.update({
      companyId: updateEquipmentDto.companyId,
      equipmentType: updateEquipmentDto.equipmentType,
      make: updateEquipmentDto.make,
      capacity: updateEquipmentDto.capacity,
      status: updateEquipmentDto.status,
      modifiedBy: modifiedBy || null,
    });

    // Persist changes
    return this.equipmentRepository.update(equipmentId, equipment);
  }
}
