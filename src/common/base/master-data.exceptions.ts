/**
 * Base Exceptions for Master Data Operations
 */
export class MasterDataNotFoundException extends Error {
  constructor(
    public readonly entityName: string,
    public readonly id: string,
  ) {
    super(`${entityName} with ID ${id} not found`);
    this.name = 'MasterDataNotFoundException';
  }
}

export class DuplicateMasterDataException extends Error {
  constructor(
    public readonly entityName: string,
    public readonly field: string,
    public readonly value: string,
  ) {
    super(`${entityName} with ${field} '${value}' already exists`);
    this.name = 'DuplicateMasterDataException';
  }
}

export class MasterDataInUseException extends Error {
  constructor(
    public readonly entityName: string,
    public readonly id: string,
    public readonly usedIn: string,
  ) {
    super(`${entityName} with ID ${id} is being used in ${usedIn} and cannot be deleted`);
    this.name = 'MasterDataInUseException';
  }
}
