-- Migration: Add missing Company Master fields (MySQL Version)
-- Date: 2025-01-XX
-- Description: Adds all new fields for Company Master module including addresses, authorized person, PCB compliance, CTO, CTE, and GST details
-- 
-- IMPORTANT: Run this migration before removing 'select: false' from company.entity.ts
-- After migration, remove 'select: false' from all new columns in company.entity.ts

-- Address Information
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS regd_office_address TEXT NULL,
ADD COLUMN IF NOT EXISTS admin_office_address TEXT NULL,
ADD COLUMN IF NOT EXISTS factory_address TEXT NULL;

-- Authorized Person Information
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS auth_person_name VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS auth_person_designation VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS auth_person_dob DATE NULL;

-- PCB & Compliance
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pcb_auth_num VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS hazardous_waste_num VARCHAR(100) NULL;

-- CTO (Consent To Operate) - Water
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cto_water_num VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS cto_water_date DATE NULL,
ADD COLUMN IF NOT EXISTS cto_water_valid_upto DATE NULL;

-- CTO (Consent To Operate) - Air
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cto_air_num VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS cto_air_date DATE NULL,
ADD COLUMN IF NOT EXISTS cto_air_valid_upto DATE NULL;

-- CTE (Consent To Establish) - Water
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cte_water_num VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS cte_water_date DATE NULL,
ADD COLUMN IF NOT EXISTS cte_water_valid_upto DATE NULL;

-- CTE (Consent To Establish) - Air
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cte_air_num VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS cte_air_date DATE NULL,
ADD COLUMN IF NOT EXISTS cte_air_valid_upto DATE NULL;

-- GST Details
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pcb_zone_id VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS gst_valid_from DATE NULL,
ADD COLUMN IF NOT EXISTS gst_rate VARCHAR(20) NULL;

-- Verify all columns were added
SHOW COLUMNS FROM companies WHERE Field IN (
    'regd_office_address', 'admin_office_address', 'factory_address',
    'auth_person_name', 'auth_person_designation', 'auth_person_dob',
    'pcb_auth_num', 'hazardous_waste_num',
    'cto_water_num', 'cto_water_date', 'cto_water_valid_upto',
    'cto_air_num', 'cto_air_date', 'cto_air_valid_upto',
    'cte_water_num', 'cte_water_date', 'cte_water_valid_upto',
    'cte_air_num', 'cte_air_date', 'cte_air_valid_upto',
    'pcb_zone_id', 'gst_valid_from', 'gst_rate'
);
