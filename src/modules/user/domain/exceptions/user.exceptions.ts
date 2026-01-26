import { ConflictException, BadRequestException } from '@nestjs/common';

/**
 * Domain Exceptions - Business logic exceptions
 * These are framework-aware but domain-focused
 */
export class DuplicateMobileNumberException extends ConflictException {
  constructor(mobileNumber: string, companyId: string) {
    super(
      `User with mobile number ${mobileNumber} already exists for this company`,
    );
  }
}

export class DuplicateUserNameException extends ConflictException {
  constructor(userName: string, companyId: string) {
    super(`User with user name ${userName} already exists for this company`);
  }
}

export class UserNotFoundException extends BadRequestException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}

export class UserNotDraftException extends BadRequestException {
  constructor(userId: string, currentStatus: string) {
    super(
      `User ${userId} cannot be activated. Current status is ${currentStatus}. Only Draft users can be activated.`,
    );
  }
}
