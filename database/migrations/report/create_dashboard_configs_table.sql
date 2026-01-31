-- Create dashboard_configs table in medi_waste_management_report database
-- This table stores dashboard widget and menu configurations for each role/department
-- Dashboard APIs are read-only and do not modify business logic

CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(100) NOT NULL UNIQUE,
  widgets JSONB,
  "menuItems" JSONB,
  permissions JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on role for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_role ON dashboard_configs(role);

-- Add comment to table
COMMENT ON TABLE dashboard_configs IS 'Stores dashboard widget and menu configurations for each role/department. Configuration-only table that does not affect business logic.';
