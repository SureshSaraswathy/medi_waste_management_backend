import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'medi-waste-management-backend',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  superAdmin: {
    username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
    password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
    staticOtp: process.env.SUPER_ADMIN_STATIC_OTP || '123456',
    userId: process.env.SUPER_ADMIN_USER_ID || '00000000-0000-0000-0000-000000000001',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@medi-waste.io',
  },
  email: {
    // Enabled if explicitly turned on OR if SMTP credentials are configured.
    // This prevents accidental "enabled but not configured" states.
    enabled:
      process.env.EMAIL_ENABLED === 'true' ||
      (!!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD && !!process.env.SMTP_HOST) ||
      false,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      // Do NOT provide default credentials in code. Configure via environment variables.
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@medi-waste.io',
    fromName: process.env.EMAIL_FROM_NAME || 'Medi Waste Management System',
  },
  otp: {
    enabled: process.env.OTP_ENABLED === 'true' || false, // Enable/disable OTP requirement
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Default: 24 hours (can be: '1h', '7d', '30d', etc.)
  },
}));
