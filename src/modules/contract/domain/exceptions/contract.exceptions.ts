export class ContractNotFoundException extends Error {
  constructor(id: string) {
    super(`Contract with ID ${id} not found`);
    this.name = 'ContractNotFoundException';
  }
}

export class ContractAlreadyExistsException extends Error {
  constructor(contractNum: string, companyId: string) {
    super(`Contract with number ${contractNum} already exists for company ${companyId}`);
    this.name = 'ContractAlreadyExistsException';
  }
}

import { BadRequestException } from '@nestjs/common';

export class ActiveContractExistsException extends BadRequestException {
  constructor(hcfId: string) {
    super(`An active or non-expired contract already exists for HCF ${hcfId}. Please wait until the existing contract expires before creating a new one.`);
  }
}