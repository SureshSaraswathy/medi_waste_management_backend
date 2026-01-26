import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { Color } from '../entities/color.domain.entity';

export const COLOR_REPOSITORY_TOKEN = 'COLOR_REPOSITORY';

export interface IColorRepository extends IBaseMasterRepository<Color> {
  findByColorNameAndCompany(colorName: string, companyId: string): Promise<Color | null>;
  findByCompany(companyId: string): Promise<Color[]>;
}
