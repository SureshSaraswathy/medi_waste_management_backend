import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class DistrictNotFoundException extends MasterDataNotFoundException {
  constructor(districtId: string) {
    super('District', districtId);
    this.name = 'DistrictNotFoundException';
  }
}

export class DuplicateDistrictCodeException extends DuplicateMasterDataException {
  constructor(districtCode: string) {
    super('District', 'districtCode', districtCode);
    this.name = 'DuplicateDistrictCodeException';
  }
}

export class DuplicateDistrictNameException extends DuplicateMasterDataException {
  constructor(districtName: string) {
    super('District', 'districtName', districtName);
    this.name = 'DuplicateDistrictNameException';
  }
}
