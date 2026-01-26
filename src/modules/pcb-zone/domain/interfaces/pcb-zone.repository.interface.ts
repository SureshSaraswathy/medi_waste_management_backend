import { IBaseMasterRepository } from '../../../../common/base/master-data.repository.interface';
import { PcbZone } from '../entities/pcb-zone.domain.entity';

export const PCB_ZONE_REPOSITORY_TOKEN = 'PCB_ZONE_REPOSITORY';

export interface IPcbZoneRepository extends IBaseMasterRepository<PcbZone> {
  findByPcbZoneName(pcbZoneName: string): Promise<PcbZone | null>;
}
