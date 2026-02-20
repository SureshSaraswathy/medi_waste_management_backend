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

  /**
   * Send bulk invoice ZIP download link email
   */
  async sendBulkInvoiceZipEmail(params: {
    to: string;
    downloadUrl: string;
    invoiceCount: number;
    expiresAt?: string;
  }): Promise<boolean> {
    const { to, downloadUrl, invoiceCount, expiresAt } = params;

    if (!this.emailEnabled) {
      this.logger.warn(`Email service is disabled. Bulk invoice ZIP email not sent for ${to}.`);
      return false;
    }

    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const subject = `Bulk Invoice PDFs Ready (${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'})`;

      const expiryLine = expiresAt
        ? `<p style="margin-top: 12px; color:#6b7280; font-size: 12px;">Link expires at: <strong>${expiresAt}</strong></p>`
        : '';

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0f172a; color: white; padding: 16px 20px; border-radius: 10px; }
            .content { padding: 20px; background-color: #f9fafb; border-radius: 10px; margin-top: 12px; }
            .btn { display:inline-block; background:#2563eb; color:#fff; padding: 12px 16px; border-radius: 8px; text-decoration: none; }
            .meta { color:#6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;">Medi Waste Management</h2>
            </div>
            <div class="content">
              <p>Your bulk invoice PDF ZIP is ready.</p>
              <p class="meta">Invoices: <strong>${invoiceCount}</strong></p>
              <p style="margin: 16px 0;">
                <a class="btn" href="${downloadUrl}" target="_blank" rel="noopener noreferrer">Download ZIP</a>
              </p>
              ${expiryLine}
              <p class="meta">If you did not request this, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `Bulk invoice PDF ZIP is ready.\nInvoices: ${invoiceCount}\nDownload: ${downloadUrl}\n${expiresAt ? `Link expires at: ${expiresAt}\n` : ''}`;

      const mailOptions = {
        from: `"${this.emailFromName}" <${this.emailFrom}>`,
        to,
        subject,
        text: textBody,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Bulk invoice ZIP email sent to ${to}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send bulk invoice ZIP email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send HCF password reset email (admin-initiated)
   */
  async sendHCFPasswordReset(params: {
    email: string;
    hcfCode: string;
    hcfName: string;
    temporaryPassword: string;
    expiryHours: number;
  }): Promise<boolean> {
    const { email, hcfCode, hcfName, temporaryPassword, expiryHours } = params;

    if (!this.emailEnabled) {
      this.logger.warn(`Email service is disabled. HCF password reset email not sent for ${email}.`);
      return false;
    }

    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const subject = 'HCF Login Credentials - Medi Waste Management System';
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
            .credentials-box { background-color: #ffffff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { font-size: 18px; color: #111827; font-family: monospace; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; padding: 12px; background-color: #fee2e2; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medi Waste Management System</h1>
            </div>
            <div class="content">
              <h2>HCF Login Credentials</h2>
              <p>Hello,</p>
              <p>Your HCF login credentials have been reset. Please use the following credentials to login:</p>
              
              <div class="credentials-box">
                <div class="credential-item">
                  <span class="label">HCF Code:</span>
                  <div class="value">${hcfCode}</div>
                </div>
                <div class="credential-item">
                  <span class="label">Temporary Password:</span>
                  <div class="value">${temporaryPassword}</div>
                </div>
              </div>

              <div class="warning">
                <strong>Important:</strong> This is a temporary password. You will be required to change it on your first login.
                This password expires in ${expiryHours} hours.
              </div>

              <p style="margin-top: 20px;">
                <a href="${this.configService.get('app.frontendUrl') || 'http://localhost:3000'}/login" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Login Now
                </a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Medi Waste Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
HCF Login Credentials - Medi Waste Management System

Hello,

Your HCF login credentials have been reset. Please use the following credentials to login:

HCF Code: ${hcfCode}
Temporary Password: ${temporaryPassword}

IMPORTANT: This is a temporary password. You will be required to change it on your first login.
This password expires in ${expiryHours} hours.

Login URL: ${this.configService.get('app.frontendUrl') || 'http://localhost:3000'}/login

This is an automated message. Please do not reply to this email.
      `.trim();

      const mailOptions = {
        from: `"${this.emailFromName}" <${this.emailFrom}>`,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`HCF password reset email sent to ${email}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send HCF password reset email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send HCF password reset link email (self-service)
   */
  async sendHCFPasswordResetLink(params: {
    email: string;
    hcfCode: string;
    hcfName: string;
    resetLink: string;
    expiryMinutes: number;
  }): Promise<boolean> {
    const { email, hcfCode, hcfName, resetLink, expiryMinutes } = params;

    if (!this.emailEnabled) {
      this.logger.warn(`Email service is disabled. HCF password reset link email not sent for ${email}.`);
      return false;
    }

    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const subject = 'Reset Your HCF Password - Medi Waste Management System';
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
            .btn { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; padding: 12px; background-color: #fee2e2; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Medi Waste Management System</h1>
            </div>
            <div class="content">
              <h2>Reset Your HCF Password</h2>
              <p>Hello,</p>
              <p>You have requested to reset your password for HCF <strong>${hcfCode} - ${hcfName}</strong>.</p>
              
              <p>Click the button below to reset your password:</p>
              <a href="${resetLink}" class="btn">Reset Password</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 12px;">${resetLink}</p>

              <div class="warning">
                <strong>Important:</strong> This link will expire in ${expiryMinutes} minutes.
                If you did not request this password reset, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Medi Waste Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
Reset Your HCF Password - Medi Waste Management System

Hello,

You have requested to reset your password for HCF ${hcfCode} - ${hcfName}.

Click the link below to reset your password:
${resetLink}

IMPORTANT: This link will expire in ${expiryMinutes} minutes.
If you did not request this password reset, please ignore this email.

This is an automated message. Please do not reply to this email.
      `.trim();

      const mailOptions = {
        from: `"${this.emailFromName}" <${this.emailFrom}>`,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`HCF password reset link email sent to ${email}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send HCF password reset link email to ${email}:`, error);
      return false;
    }
  }
}
