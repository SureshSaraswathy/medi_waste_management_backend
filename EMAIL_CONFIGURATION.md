# Email Configuration Guide

This guide explains how to configure email settings for OTP delivery in the Medi Waste Management System.

## Environment Variables

Add the following environment variables to your `.env` file:

### Email Service Configuration

```env
# Enable/Disable Email Service
EMAIL_ENABLED=true

# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  # true for port 465, false for other ports

# SMTP Authentication
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email From Address
EMAIL_FROM=noreply@medi-waste.io
EMAIL_FROM_NAME=Medi Waste Management System

# OTP Configuration
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6
```

## Gmail Configuration

### Step 1: Enable 2-Step Verification
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to Google Account → Security
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Enter "Medi Waste Management" as the name
5. Click "Generate"
6. Copy the 16-character password
7. Use this password in `SMTP_PASSWORD`

### Step 3: Update .env File
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Medi Waste Management System
```

## Other Email Providers

### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
```

## Testing Email Configuration

1. Start the backend server
2. The email service will automatically verify the connection on startup
3. Check the logs for:
   - `Email service initialized with SMTP: ...`
   - `Email transporter connection verified`

## Disabling Email (Development Mode)

If you want to disable email sending (e.g., for development):

```env
EMAIL_ENABLED=false
```

When disabled, OTPs will be logged to the console instead of being sent via email.

## Troubleshooting

### Email Not Sending
1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify SMTP credentials are correct
3. Check firewall/network settings
4. For Gmail, ensure you're using an App Password, not your regular password
5. Check backend logs for error messages

### Connection Timeout
- Verify SMTP_HOST and SMTP_PORT are correct
- Check if your network/firewall allows SMTP connections
- Try using SMTP_SECURE=true with port 465

### Authentication Failed
- Verify SMTP_USER and SMTP_PASSWORD are correct
- For Gmail, ensure 2-Step Verification is enabled and you're using an App Password
- Check if your email provider requires specific authentication methods

## API Endpoints

### Send OTP
```
POST /api/v1/auth/send-otp
Body: { "usernameOrEmail": "user@example.com" }
```

### Verify OTP
```
POST /api/v1/auth/verify-otp
Body: { "usernameOrEmail": "user@example.com", "otp": "123456" }
```

## Security Notes

1. Never commit `.env` file to version control
2. Use App Passwords instead of regular passwords for Gmail
3. Keep SMTP credentials secure
4. Use environment-specific configurations for different environments
5. Consider using a dedicated email service (SendGrid, Mailgun, AWS SES) for production
