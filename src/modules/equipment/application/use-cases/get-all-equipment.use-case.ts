import { Injectable, Inject } from '@nestjs/common';
import { IEquipmentRepository, EQUIPMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/equipment.repository.interface';
import { Equipment } from '../../domain/entities/equipment.domain.entity';

@Injectable()
export class GetAllEquipmentUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY_TOKEN)
    private readonly equipmentRepository: IEquipmentRepository,
  ) {}

  async execute(activeOnly: boolean = false, companyId?: string): Promise<Equipment[]> {
    if (companyId) {
      if (activeOnly) {
        return this.equipmentRepository.findActiveByCompanyId(companyId);
      }
      return this.equipmentRepository.findByCompanyId(companyId);
    }

    if (activeOnly) {
      return this.equipmentRepository.findAllActive();
    }
    return this.equipmentRepository.findAll();
  }
}
