import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../../../../common/base/master-data.exceptions';
import { HttpException, HttpStatus } from '@nestjs/common';

export class FinanceYearNotFoundException extends MasterDataNotFoundException {
  constructor(financeYearId: string) {
    super('Finance Year', financeYearId);
    this.name = 'FinanceYearNotFoundException';
  }
}

export class DuplicateFinanceYearException extends HttpException {
  constructor(finYear: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Finance Year '${finYear}' already exists.`,
        error: 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateFinanceYearException';
  }
}

export class PastFinanceYearException extends HttpException {
  constructor(startYear: number) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Past financial years cannot be created. Start year ${startYear} is in the past.`,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PastFinanceYearException';
  }
}
