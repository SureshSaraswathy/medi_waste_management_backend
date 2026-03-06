import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Equipment } from '../entities/equipment.domain.entity';

export const EQUIPMENT_REPOSITORY_TOKEN = 'EQUIPMENT_REPOSITORY';

export interface IEquipmentRepository extends IBaseMasterRepository<Equipment> {
  /**
   * Find by equipment code
   */
  findByEquipmentCode(equipmentCode: string): Promise<Equipment | null>;

  /**
   * Find all equipment by company ID
   */
  findByCompanyId(companyId: string): Promise<Equipment[]>;

  /**
   * Find all active equipment by company ID
   */
  findActiveByCompanyId(companyId: string): Promise<Equipment[]>;
}
