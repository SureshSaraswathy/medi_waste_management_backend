import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpStore {
  otp: string;
  expiresAt: number;
  attempts: number;
}

/**
 * OTP Service
 * Manages OTP generation, storage, and verification
 * In production, this should use Redis or a database
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpStore>();
  private readonly expiryMinutes: number;
  private readonly otpLength: number;
  private readonly maxAttempts = 3;

  constructor(private readonly configService: ConfigService) {
    const otpConfig = this.configService.get('app.otp');
    this.expiryMinutes = otpConfig?.expiryMinutes || 5;
    this.otpLength = otpConfig?.length || 6;
  }

  /**
   * Generate a random OTP
   */
  generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  /**
   * Store OTP for a user
   */
  storeOTP(identifier: string, otp: string): void {
    const expiresAt = Date.now() + this.expiryMinutes * 60 * 1000;
    this.otpStore.set(identifier.toLowerCase(), {
      otp,
      expiresAt,
      attempts: 0,
    });
    
    // Clean up expired OTPs periodically
    this.cleanupExpiredOTPs();
  }

  /**
   * Verify OTP
   */
  verifyOTP(identifier: string, otp: string): { valid: boolean; message?: string } {
    const normalizedIdentifier = identifier.toLowerCase();
    const stored = this.otpStore.get(normalizedIdentifier);

    if (!stored) {
      return { valid: false, message: 'OTP not found. Please request a new OTP.' };
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(normalizedIdentifier);
      return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (stored.attempts >= this.maxAttempts) {
      this.otpStore.delete(normalizedIdentifier);
      return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    stored.attempts++;

    if (stored.otp !== otp) {
      return { valid: false, message: 'Invalid OTP. Please try again.' };
    }

    // OTP verified successfully, remove it
    this.otpStore.delete(normalizedIdentifier);
    return { valid: true };
  }

  /**
   * Get remaining time for OTP (in seconds)
   */
  getRemainingTime(identifier: string): number {
    const stored = this.otpStore.get(identifier.toLowerCase());
    if (!stored) {
      return 0;
    }
    const remaining = Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000));
    return remaining;
  }

  /**
   * Check if OTP exists and is not expired
   */
  hasValidOTP(identifier: string): boolean {
    const stored = this.otpStore.get(identifier.toLowerCase());
    if (!stored) {
      return false;
    }
    return Date.now() < stored.expiresAt;
  }

  /**
   * Remove OTP (e.g., after successful verification)
   */
  removeOTP(identifier: string): void {
    this.otpStore.delete(identifier.toLowerCase());
  }

  /**
   * Clean up expired OTPs
   */
  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [identifier, stored] of this.otpStore.entries()) {
      if (now > stored.expiresAt) {
        this.otpStore.delete(identifier);
      }
    }
  }
}
