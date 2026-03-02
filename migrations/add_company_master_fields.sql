-- Migration: Add missing Company Master fields
-- Date: 2025-01-XX
-- Description: Adds all new fields for Company Master module including addresses, authorized person, PCB compliance, CTO, CTE, and GST details
-- 
-- IMPORTANT: Run this migration before removing 'select: false' from company.entity.ts
-- After migration, remove 'select: false' from all new columns in company.entity.ts

-- Check if columns exist before adding (PostgreSQL syntax)
-- For MySQL, use: IF NOT EXISTS syntax or check manually

-- Address Information
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'regd_office_address') THEN
        ALTER TABLE companies ADD COLUMN regd_office_address TEXT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'admin_office_address') THEN
        ALTER TABLE companies ADD COLUMN admin_office_address TEXT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'factory_address') THEN
        ALTER TABLE companies ADD COLUMN factory_address TEXT NULL;
    END IF;
END $$;

-- Authorized Person Information
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'auth_person_name') THEN
        ALTER TABLE companies ADD COLUMN auth_person_name VARCHAR(200) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'auth_person_designation') THEN
        ALTER TABLE companies ADD COLUMN auth_person_designation VARCHAR(200) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'auth_person_dob') THEN
        ALTER TABLE companies ADD COLUMN auth_person_dob DATE NULL;
    END IF;
END $$;

-- PCB & Compliance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'pcb_auth_num') THEN
        ALTER TABLE companies ADD COLUMN pcb_auth_num VARCHAR(100) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'hazardous_waste_num') THEN
        ALTER TABLE companies ADD COLUMN hazardous_waste_num VARCHAR(100) NULL;
    END IF;
END $$;

-- CTO (Consent To Operate) - Water
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cto_water_num') THEN
        ALTER TABLE companies ADD COLUMN cto_water_num VARCHAR(100) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cto_water_date') THEN
        ALTER TABLE companies ADD COLUMN cto_water_date DATE NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cto_water_valid_upto') THEN
        ALTER TABLE companies ADD COLUMN cto_water_valid_upto DATE NULL;
    END IF;
END $$;

-- CTO (Consent To Operate) - Air
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cto_air_num') THEN
        ALTER TABLE companies ADD COLUMN cto_air_num VARCHAR(100) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cto_air_date') THEN
        ALTER TABLE companies ADD COLUMN cto_air_date DATE NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cto_air_valid_upto') THEN
        ALTER TABLE companies ADD COLUMN cto_air_valid_upto DATE NULL;
    END IF;
END $$;

-- CTE (Consent To Establish) - Water
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cte_water_num') THEN
        ALTER TABLE companies ADD COLUMN cte_water_num VARCHAR(100) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cte_water_date') THEN
        ALTER TABLE companies ADD COLUMN cte_water_date DATE NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cte_water_valid_upto') THEN
        ALTER TABLE companies ADD COLUMN cte_water_valid_upto DATE NULL;
    END IF;
END $$;

-- CTE (Consent To Establish) - Air
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cte_air_num') THEN
        ALTER TABLE companies ADD COLUMN cte_air_num VARCHAR(100) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cte_air_date') THEN
        ALTER TABLE companies ADD COLUMN cte_air_date DATE NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'cte_air_valid_upto') THEN
        ALTER TABLE companies ADD COLUMN cte_air_valid_upto DATE NULL;
    END IF;
END $$;

-- GST Details
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'pcb_zone_id') THEN
        ALTER TABLE companies ADD COLUMN pcb_zone_id VARCHAR(50) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'gst_valid_from') THEN
        ALTER TABLE companies ADD COLUMN gst_valid_from DATE NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'gst_rate') THEN
        ALTER TABLE companies ADD COLUMN gst_rate VARCHAR(20) NULL;
    END IF;
END $$;

-- Verify all columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN (
    'regd_office_address', 'admin_office_address', 'factory_address',
    'auth_person_name', 'auth_person_designation', 'auth_person_dob',
    'pcb_auth_num', 'hazardous_waste_num',
    'cto_water_num', 'cto_water_date', 'cto_water_valid_upto',
    'cto_air_num', 'cto_air_date', 'cto_air_valid_upto',
    'cte_water_num', 'cte_water_date', 'cte_water_valid_upto',
    'cte_air_num', 'cte_air_date', 'cte_air_valid_upto',
    'pcb_zone_id', 'gst_valid_from', 'gst_rate'
)
ORDER BY column_name;
