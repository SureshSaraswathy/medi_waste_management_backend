import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Email Service
 * Handles sending emails via SMTP
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly emailEnabled: boolean;
  private readonly emailFrom: string;
  private readonly emailFromName: string;

  constructor(private readonly configService: ConfigService) {
    const emailConfig = this.configService.get('app.email');

    // Enable email only when SMTP is actually configured.
    // This avoids "enabled but empty creds" and auto-enables when user+pass are present.
    const smtpHost = emailConfig?.host || '';
    const smtpUser = emailConfig?.auth?.user || '';
    const smtpPass = emailConfig?.auth?.pass || '';
    const hasSmtpConfig = !!smtpHost && !!smtpUser && !!smtpPass;

    this.emailEnabled = !!emailConfig?.enabled && hasSmtpConfig;
    this.emailFrom = emailConfig?.from || 'noreply@medi-waste.io';
    this.emailFromName = emailConfig?.fromName || 'Medi Waste Management System';

    if (this.emailEnabled) {
      this.initializeTransporter();
    } else {
      if (!emailConfig?.enabled) {
        this.logger.warn('Email service is disabled. Set EMAIL_ENABLED=true (and SMTP_* variables) to enable.');
      } else {
        this.logger.warn('Email service is disabled because SMTP is not fully configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD).');
      }
    }
  }

  private initializeTransporter() {
    try {
      const emailConfig = this.configService.get('app.email');
      
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure, // true for 465, false for other ports
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass,
        },
      });

      this.logger.log(`Email service initialized with SMTP: ${emailConfig.host}:${emailConfig.port}`);
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(to: string, otp: string, userName?: string): Promise<boolean> {
    if (!this.emailEnabled) {
      // Do not log OTP values.
      this.logger.warn(`Email service is disabled. OTP email not sent for ${to}.`);
      return false;
    }

    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const subject = 'Your OTP for Login - Medi Waste Management System';
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .otp-box { background-color: #ffffff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medi Waste Management System</h1>
            </div>
            <div class="content">
              <p>Hello${userName ? ` ${userName}` : ''},</p>
              <p>You have requested a One-Time Password (OTP) to login to your account.</p>
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Your OTP is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP is valid for ${this.configService.get('app.otp.expiryMinutes') || 5} minutes.</p>
              <p class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
              </p>
              <p>If you did not request this OTP, please ignore this email or contact support immediately.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Medi Waste Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
Medi Waste Management System

Hello${userName ? ` ${userName}` : ''},

You have requested a One-Time Password (OTP) to login to your account.

Your OTP is: ${otp}

This OTP is valid for ${this.configService.get('app.otp.expiryMinutes') || 5} minutes.

⚠️ Security Notice: Never share this OTP with anyone. Our team will never ask for your OTP.

If you did not request this OTP, please ignore this email or contact support immediately.

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Medi Waste Management System. All rights reserved.
      `;

      const mailOptions = {
        from: `"${this.emailFromName}" <${this.emailFrom}>`,
        to,
        subject,
        text: textBody,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('Email transporter connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email transporter verification failed:', error);
      return false;
    }
  }
}
