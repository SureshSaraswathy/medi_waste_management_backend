-- Migration: Add password management fields to users table
-- Date: 2026-01-17
-- Description: Adds password_hash, force_password_change, temporary_password, and temporary_password_expiry columns

-- Add password_hash column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL;

-- Add force_password_change column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT false;

-- Add temporary_password column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(255) NULL;

-- Add temporary_password_expiry column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS temporary_password_expiry TIMESTAMP NULL;

-- Add comment to columns for documentation
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password for user authentication';
COMMENT ON COLUMN users.force_password_change IS 'Flag to force password change on next login';
COMMENT ON COLUMN users.temporary_password IS 'Temporary password (plain text, stored temporarily for display)';
COMMENT ON COLUMN users.temporary_password_expiry IS 'Expiry timestamp for temporary password (24 hours from generation)';
