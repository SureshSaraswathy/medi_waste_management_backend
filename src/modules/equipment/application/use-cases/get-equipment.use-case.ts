import { Injectable, Inject } from '@nestjs/common';
import { IEquipmentRepository, EQUIPMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/equipment.repository.interface';
import { Equipment } from '../../domain/entities/equipment.domain.entity';
import { EquipmentNotFoundException } from '../../domain/exceptions/equipment.exceptions';

@Injectable()
export class GetEquipmentUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY_TOKEN)
    private readonly equipmentRepository: IEquipmentRepository,
  ) {}

  async execute(equipmentId: string): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundException(equipmentId);
    }
    return equipment;
  }
}
