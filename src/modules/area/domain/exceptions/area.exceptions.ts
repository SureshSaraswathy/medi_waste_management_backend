import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class AreaNotFoundException extends MasterDataNotFoundException {
  constructor(areaId: string) {
    super('Area', areaId);
    this.name = 'AreaNotFoundException';
  }
}

export class DuplicateAreaCodeException extends DuplicateMasterDataException {
  constructor(areaCode: string) {
    super('Area', 'areaCode', areaCode);
    this.name = 'DuplicateAreaCodeException';
  }
}

export class DuplicateAreaNameException extends DuplicateMasterDataException {
  constructor(areaName: string) {
    super('Area', 'areaName', areaName);
    this.name = 'DuplicateAreaNameException';
  }
}
