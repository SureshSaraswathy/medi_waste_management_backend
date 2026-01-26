import { MasterDataNotFoundException, DuplicateMasterDataException } from '../../../../common/base/master-data.exceptions';

export class PcbZoneNotFoundException extends MasterDataNotFoundException {
  constructor(pcbZoneId: string) {
    super('PcbZone', pcbZoneId);
  }
}

export class DuplicatePcbZoneNameException extends DuplicateMasterDataException {
  constructor(pcbZoneName: string) {
    super('PcbZone', 'pcbZoneName', pcbZoneName);
  }
}
