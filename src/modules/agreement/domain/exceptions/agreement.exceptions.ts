export class AgreementNotFoundException extends Error {
  constructor(id: string) {
    super(`Agreement with ID ${id} not found`);
    this.name = 'AgreementNotFoundException';
  }
}

export class AgreementAlreadyExistsException extends Error {
  constructor(agreementNum: string, contractId: string) {
    super(`Agreement with number ${agreementNum} already exists for contract ${contractId}`);
    this.name = 'AgreementAlreadyExistsException';
  }
}
