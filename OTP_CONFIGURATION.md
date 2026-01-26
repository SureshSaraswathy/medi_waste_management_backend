# OTP Configuration Guide

## How OTP Works

**OTP is user-specific** - Each user has an `otpEnabled` flag in the database:
- If `otpEnabled = true` → User will be asked for OTP after password login
- If `otpEnabled = false` → User can login directly without OTP

## User-Level OTP Control

**The system checks the user's `otpEnabled` flag in the database:**
- When creating/editing a user, you can set `otpEnabled: true` or `otpEnabled: false`
- Only users with `otpEnabled: true` will be asked for OTP
- Users with `otpEnabled: false` can login directly

## Email Configuration (Required only if OTP is enabled for users)

If you have users with `otpEnabled: true`, you need to configure email/SMTP:

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@medi-waste.io
EMAIL_FROM_NAME=Medi Waste Management System
```

## Global OTP Setting (Optional)

The `OTP_ENABLED` environment variable only affects Super Admin:
- `OTP_ENABLED=false` → Super admin can login without OTP
- `OTP_ENABLED=true` → Super admin must use static OTP

**Note:** Regular users are controlled by their individual `otpEnabled` flag in the database, not the global setting.

## Default Behavior

- **By default, new users have `otpEnabled: false`**
- Users can login directly without OTP
- No email/SMTP configuration needed unless you enable OTP for specific users

## Enabling OTP for a User

1. When creating a user, set `otpEnabled: true` in the user creation form
2. Or update an existing user and set `otpEnabled: true`
3. Configure SMTP settings in `.env` file
4. That user will now be asked for OTP after password login

## Disabling OTP for a User

1. Edit the user in User Management
2. Set `otpEnabled: false` in the user activation settings
3. That user can now login directly without OTP

## Super Admin OTP

Super admin uses a static OTP (configurable via `SUPER_ADMIN_STATIC_OTP`):
- Controlled by `OTP_ENABLED` environment variable
- If `OTP_ENABLED=false`, super admin can login without OTP
- If `OTP_ENABLED=true`, super admin must use static OTP (`123456` by default)

## Quick Start (No OTP for Users)

1. Create users with `otpEnabled: false` (default)
2. Users can login directly without OTP
3. No SMTP configuration needed

## Quick Start (OTP for Specific Users)

1. Configure SMTP in `.env`:
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

2. Set `otpEnabled: true` for users who need OTP
3. Those users will receive OTP via email after password login
