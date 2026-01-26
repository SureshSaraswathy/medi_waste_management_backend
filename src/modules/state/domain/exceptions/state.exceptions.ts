import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class StateNotFoundException extends MasterDataNotFoundException {
  constructor(stateId: string) {
    super('State', stateId);
    this.name = 'StateNotFoundException';
  }
}

export class DuplicateStateCodeException extends DuplicateMasterDataException {
  constructor(stateCode: string) {
    super('State', 'stateCode', stateCode);
    this.name = 'DuplicateStateCodeException';
  }
}

export class DuplicateStateNameException extends DuplicateMasterDataException {
  constructor(stateName: string) {
    super('State', 'stateName', stateName);
    this.name = 'DuplicateStateNameException';
  }
}
