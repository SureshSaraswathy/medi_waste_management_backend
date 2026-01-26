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
