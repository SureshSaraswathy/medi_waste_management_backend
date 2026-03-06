import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class EquipmentNotFoundException extends MasterDataNotFoundException {
  constructor(equipmentId: string) {
    super('Equipment', equipmentId);
    this.name = 'EquipmentNotFoundException';
  }
}

export class DuplicateEquipmentCodeException extends DuplicateMasterDataException {
  constructor(equipmentCode: string) {
    super('Equipment', 'equipmentCode', equipmentCode);
    this.name = 'DuplicateEquipmentCodeException';
  }
}
