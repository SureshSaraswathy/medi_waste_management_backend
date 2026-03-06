import { Injectable, Inject } from '@nestjs/common';
import { IEquipmentRepository, EQUIPMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/equipment.repository.interface';
import { EquipmentNotFoundException } from '../../domain/exceptions/equipment.exceptions';

@Injectable()
export class DeleteEquipmentUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY_TOKEN)
    private readonly equipmentRepository: IEquipmentRepository,
  ) {}

  async execute(equipmentId: string, modifiedBy?: string): Promise<void> {
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundException(equipmentId);
    }

    await this.equipmentRepository.softDelete(equipmentId);
  }
}
