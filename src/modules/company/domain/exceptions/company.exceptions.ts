import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';

export class CompanyNotFoundException extends MasterDataNotFoundException {
  constructor(companyId: string) {
    super('Company', companyId);
    this.name = 'CompanyNotFoundException';
  }
}

export class DuplicateCompanyCodeException extends DuplicateMasterDataException {
  constructor(companyCode: string) {
    super('Company', 'companyCode', companyCode);
    this.name = 'DuplicateCompanyCodeException';
  }
}
