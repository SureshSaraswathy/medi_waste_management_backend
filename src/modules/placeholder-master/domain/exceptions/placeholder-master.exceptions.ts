import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class PlaceholderMasterNotFoundException extends MasterDataNotFoundException {
  constructor(placeholderId: string) {
    super('Placeholder Master', placeholderId);
    this.name = 'PlaceholderMasterNotFoundException';
  }
}

export class DuplicatePlaceholderCodeException extends DuplicateMasterDataException {
  constructor(placeholderCode: string) {
    super('Placeholder Master', 'placeholderCode', placeholderCode);
    this.name = 'DuplicatePlaceholderCodeException';
  }
}
