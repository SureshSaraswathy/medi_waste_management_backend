import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';

/**
 * Exception: HCF not found
 */
export class HCFNotFoundException extends NotFoundException {
  constructor(hcfId: string) {
    super(`HCF with ID ${hcfId} not found`);
  }
}

/**
 * Exception: HCF login not enabled
 */
export class HCFLoginNotEnabledException extends UnauthorizedException {
  constructor(hcfCode: string) {
    super(`Login is not enabled for HCF ${hcfCode}`);
  }
}

/**
 * Exception: Invalid HCF credentials
 */
export class InvalidHCFCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid HCF code or password');
  }
}

/**
 * Exception: HCF password expired
 */
export class HCFPasswordExpiredException extends UnauthorizedException {
  constructor() {
    super('Password has expired. Please reset your password.');
  }
}

/**
 * Exception: Invalid reset token
 */
export class InvalidResetTokenException extends BadRequestException {
  constructor() {
    super('Invalid or expired reset token');
  }
}
