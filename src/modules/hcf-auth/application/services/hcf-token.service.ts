import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Service for generating and validating reset tokens
 */
@Injectable()
export class HCFTokenService {
  /**
   * Generate a secure reset token
   */
  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get reset token expiry date (1 hour from now)
   */
  getResetTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    return expiry;
  }

  /**
   * Check if reset token is expired
   */
  isResetTokenExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) {
      return true;
    }
    return new Date() > expiryDate;
  }
}
