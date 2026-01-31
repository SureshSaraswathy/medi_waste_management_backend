-- Script to create dashboard_configs table in medi_waste_management_report database
-- Run this script in your PostgreSQL client connected to the report database
-- 
-- Usage:
-- psql -U postgres -d medi_waste_management_report -f scripts/create_dashboard_configs_table.sql
-- OR
-- Connect to the database and run the SQL commands below

-- Create dashboard_configs table
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

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'dashboard_configs' 
ORDER BY ordinal_position;
