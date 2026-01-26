import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class ColorNotFoundException extends MasterDataNotFoundException {
  constructor(colorId: string) {
    super('Color', colorId);
    this.name = 'ColorNotFoundException';
  }
}

export class DuplicateColorNameException extends DuplicateMasterDataException {
  constructor(colorName: string, companyId: string) {
    super('Color', `colorName in company ${companyId}`, colorName);
    this.name = 'DuplicateColorNameException';
  }
}
