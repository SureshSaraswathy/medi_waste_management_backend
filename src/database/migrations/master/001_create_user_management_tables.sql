-- =====================================================
-- User Management System - Complete Database Schema
-- Master Database Migration
-- =====================================================
-- 1. Companies table (Master Data)
CREATE TABLE IF NOT EXISTS companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code VARCHAR(50) NOT NULL UNIQUE,
  company_name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status) WHERE is_deleted = false;

-- 2. Users table (Step 1 - Identity Only)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id),
  user_name VARCHAR(100) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  employee_code VARCHAR(50) NULL,
  user_role_id UUID NULL, -- References roles(role_id)
  status VARCHAR(20) NOT NULL DEFAULT 'Draft', -- 'Draft' | 'Active' | 'Inactive'
  password_enabled BOOLEAN NOT NULL DEFAULT false,
  otp_enabled BOOLEAN NOT NULL DEFAULT false,
  force_otp_on_next_login BOOLEAN NOT NULL DEFAULT false,
  web_login BOOLEAN NOT NULL DEFAULT false,
  mobile_app_access BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Unique constraints for Users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_company_mobile ON users(company_id, mobile_number) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_company_username ON users(company_id, user_name) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE is_deleted = false;

-- 3. User Employee Profiles table (Step 2)
CREATE TABLE IF NOT EXISTS user_employee_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  employment_type VARCHAR(50) NULL, -- 'Full-time' | 'Part-time' | 'Contract' | 'Temporary'
  designation VARCHAR(100) NULL,
  contractor_name VARCHAR(200) NULL, -- For contract employees
  company_name_third_party VARCHAR(200) NULL, -- Third-party company name
  gross_salary DECIMAL(12, 2) NULL,
  email_address VARCHAR(255) NULL,
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id) -- One profile per user
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_employee_profiles(user_id);

-- 4. User Identity & Compliance table (Step 3)
CREATE TABLE IF NOT EXISTS user_identity_compliance (
  compliance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  aadhaar_number VARCHAR(20) NULL,
  pan_number VARCHAR(20) NULL,
  driving_license_number VARCHAR(50) NULL,
  pf_number VARCHAR(50) NULL,
  uan_number VARCHAR(50) NULL,
  esi_number VARCHAR(50) NULL,
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id) -- One compliance record per user
);

CREATE INDEX IF NOT EXISTS idx_user_compliance_user_id ON user_identity_compliance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_compliance_aadhaar ON user_identity_compliance(aadhaar_number) WHERE aadhaar_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_compliance_pan ON user_identity_compliance(pan_number) WHERE pan_number IS NOT NULL;

-- 5. User Addresses table (Step 4)
CREATE TABLE IF NOT EXISTS user_addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  address_line TEXT NULL,
  area VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  pincode VARCHAR(10) NULL,
  emergency_contact VARCHAR(20) NULL,
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id) -- One address per user (can be extended for multiple addresses)
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_city ON user_addresses(city);

-- 6. Roles table (Roles & Permissions)
CREATE TABLE IF NOT EXISTS roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id),
  role_name VARCHAR(100) NOT NULL,
  role_description TEXT NULL,
  landing_page VARCHAR(100) NULL,
  access_level VARCHAR(20) NULL, -- 'Admin' | 'Maker' | 'Checker' | 'Viewer'
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Unique role name per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_company_name ON roles(company_id, role_name) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status) WHERE is_deleted = false;

-- 7. Permissions table (Master Data)
CREATE TABLE IF NOT EXISTS permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'USER_CREATE', 'USER_VIEW'
  permission_name VARCHAR(200) NOT NULL,
  module_name VARCHAR(100) NOT NULL, -- 'User Management', 'Roles & Permissions', etc.
  description TEXT NULL,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(permission_code);

-- 8. Role Permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id) -- One permission per role (no duplicates)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- =====================================================
-- Insert Default Permissions
-- =====================================================

-- User Management Permissions
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('USER_CREATE', 'Create User', 'User Management'),
('USER_VIEW', 'View User', 'User Management'),
('USER_EDIT', 'Edit User', 'User Management'),
('USER_DELETE', 'Delete User', 'User Management'),
('USER_ACTIVATE', 'Activate User', 'User Management'),
('USER_DEACTIVATE', 'Deactivate User', 'User Management')
ON CONFLICT (permission_code) DO NOTHING;

-- Roles & Permissions
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('ROLE_CREATE', 'Create Role', 'Roles & Permissions'),
('ROLE_VIEW', 'View Role', 'Roles & Permissions'),
('ROLE_EDIT', 'Edit Role', 'Roles & Permissions'),
('ROLE_DELETE', 'Delete Role', 'Roles & Permissions'),
('ROLE_PERMISSIONS_MANAGE', 'Manage Role Permissions', 'Roles & Permissions')
ON CONFLICT (permission_code) DO NOTHING;

-- Home
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('HOME_VIEW', 'View Home', 'Home')
ON CONFLICT (permission_code) DO NOTHING;

-- Recon Onboarding
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('RECON_ONBOARDING_VIEW', 'View Recon Onboarding', 'Recon Onboarding'),
('RECON_ONBOARDING_CREATE', 'Create Recon Onboarding', 'Recon Onboarding'),
('RECON_ONBOARDING_EDIT', 'Edit Recon Onboarding', 'Recon Onboarding')
ON CONFLICT (permission_code) DO NOTHING;

-- Recon Configuration
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('RECON_CONFIG_VIEW', 'View Recon Configuration', 'Recon Configuration'),
('RECON_CONFIG_EDIT', 'Edit Recon Configuration', 'Recon Configuration')
ON CONFLICT (permission_code) DO NOTHING;

-- Recon XOXO
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('RECON_XOXO_VIEW', 'View Recon XOXO', 'Recon XOXO'),
('RECON_XOXO_CREATE', 'Create Recon XOXO', 'Recon XOXO')
ON CONFLICT (permission_code) DO NOTHING;

-- Funding
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('FUNDING_VIEW', 'View Funding', 'Funding'),
('FUNDING_APPROVE', 'Approve Funding', 'Funding')
ON CONFLICT (permission_code) DO NOTHING;

-- Reports
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('REPORTS_VIEW', 'View Reports', 'Reports'),
('REPORTS_EXPORT', 'Export Reports', 'Reports')
ON CONFLICT (permission_code) DO NOTHING;

-- Masters
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('MASTERS_VIEW', 'View Masters', 'Masters'),
('MASTERS_CREATE', 'Create Masters', 'Masters'),
('MASTERS_EDIT', 'Edit Masters', 'Masters'),
('MASTERS_DELETE', 'Delete Masters', 'Masters')
ON CONFLICT (permission_code) DO NOTHING;

-- Camspay Exceptions
INSERT INTO permissions (permission_code, permission_name, module_name) VALUES
('CAMSPAY_VIEW', 'View Camspay Exceptions', 'Camspay Exceptions'),
('CAMSPAY_RESOLVE', 'Resolve Camspay Exceptions', 'Camspay Exceptions')
ON CONFLICT (permission_code) DO NOTHING;
