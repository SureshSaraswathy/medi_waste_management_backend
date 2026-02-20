-- Migration: Add HCF Authentication Fields
-- Description: Adds authentication-related columns to hcfs table for HCF-based login
-- Date: 2024

-- Add authentication fields to hcfs table
ALTER TABLE hcfs
ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS temporary_password_expiry TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP NULL;

-- Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_hcfs_reset_token ON hcfs(reset_token) WHERE reset_token IS NOT NULL AND is_deleted = false;

-- Create index on login_enabled for filtering
CREATE INDEX IF NOT EXISTS idx_hcfs_login_enabled ON hcfs(login_enabled) WHERE login_enabled = true AND is_deleted = false;

-- Comment on columns
COMMENT ON COLUMN hcfs.login_enabled IS 'Whether HCF login is enabled';
COMMENT ON COLUMN hcfs.password_hash IS 'Hashed password for HCF login';
COMMENT ON COLUMN hcfs.force_password_change IS 'Force password change on next login';
COMMENT ON COLUMN hcfs.temporary_password IS 'Temporary password (plain text, stored temporarily)';
COMMENT ON COLUMN hcfs.temporary_password_expiry IS 'Expiry date for temporary password';
COMMENT ON COLUMN hcfs.password_changed_at IS 'Timestamp when password was last changed';
COMMENT ON COLUMN hcfs.password_expires_at IS 'Timestamp when password expires';
COMMENT ON COLUMN hcfs.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN hcfs.reset_token IS 'Password reset token';
COMMENT ON COLUMN hcfs.reset_token_expiry IS 'Expiry date for reset token';
