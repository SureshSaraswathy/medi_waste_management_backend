# Company Master Fields Migration Guide

## Overview
This guide explains how to add the missing database columns for Company Master fields that are currently not being saved.

## Problem
The Company Master form includes many fields (addresses, authorized person, PCB compliance, CTO, CTE, GST details) that are not being saved because the corresponding database columns don't exist yet.

## Solution
Run the database migration script to add all missing columns, then the application will automatically start saving these fields.

---

## Step 1: Run Database Migration

### For PostgreSQL:
```bash
psql -U your_username -d your_database -f migrations/add_company_master_fields.sql
```

### For MySQL:
```bash
mysql -u your_username -p your_database < migrations/add_company_master_fields_mysql.sql
```

### Manual Execution:
If you prefer to run SQL manually, execute the following:

**PostgreSQL:**
```sql
-- Address Information
ALTER TABLE companies ADD COLUMN IF NOT EXISTS regd_office_address TEXT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS admin_office_address TEXT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS factory_address TEXT NULL;

-- Authorized Person Information
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auth_person_name VARCHAR(200) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auth_person_designation VARCHAR(200) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auth_person_dob DATE NULL;

-- PCB & Compliance
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pcb_auth_num VARCHAR(100) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hazardous_waste_num VARCHAR(100) NULL;

-- CTO (Consent To Operate) - Water
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cto_water_num VARCHAR(100) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cto_water_date DATE NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cto_water_valid_upto DATE NULL;

-- CTO (Consent To Operate) - Air
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cto_air_num VARCHAR(100) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cto_air_date DATE NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cto_air_valid_upto DATE NULL;

-- CTE (Consent To Establish) - Water
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cte_water_num VARCHAR(100) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cte_water_date DATE NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cte_water_valid_upto DATE NULL;

-- CTE (Consent To Establish) - Air
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cte_air_num VARCHAR(100) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cte_air_date DATE NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cte_air_valid_upto DATE NULL;

-- GST Details
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pcb_zone_id VARCHAR(50) NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gst_valid_from DATE NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gst_rate VARCHAR(20) NULL;
```

**MySQL:**
```sql
-- Address Information
ALTER TABLE companies 
ADD COLUMN regd_office_address TEXT NULL,
ADD COLUMN admin_office_address TEXT NULL,
ADD COLUMN factory_address TEXT NULL;

-- Authorized Person Information
ALTER TABLE companies 
ADD COLUMN auth_person_name VARCHAR(200) NULL,
ADD COLUMN auth_person_designation VARCHAR(200) NULL,
ADD COLUMN auth_person_dob DATE NULL;

-- PCB & Compliance
ALTER TABLE companies 
ADD COLUMN pcb_auth_num VARCHAR(100) NULL,
ADD COLUMN hazardous_waste_num VARCHAR(100) NULL;

-- CTO (Consent To Operate) - Water
ALTER TABLE companies 
ADD COLUMN cto_water_num VARCHAR(100) NULL,
ADD COLUMN cto_water_date DATE NULL,
ADD COLUMN cto_water_valid_upto DATE NULL;

-- CTO (Consent To Operate) - Air
ALTER TABLE companies 
ADD COLUMN cto_air_num VARCHAR(100) NULL,
ADD COLUMN cto_air_date DATE NULL,
ADD COLUMN cto_air_valid_upto DATE NULL;

-- CTE (Consent To Establish) - Water
ALTER TABLE companies 
ADD COLUMN cte_water_num VARCHAR(100) NULL,
ADD COLUMN cte_water_date DATE NULL,
ADD COLUMN cte_water_valid_upto DATE NULL;

-- CTE (Consent To Establish) - Air
ALTER TABLE companies 
ADD COLUMN cte_air_num VARCHAR(100) NULL,
ADD COLUMN cte_air_date DATE NULL,
ADD COLUMN cte_air_valid_upto DATE NULL;

-- GST Details
ALTER TABLE companies 
ADD COLUMN pcb_zone_id VARCHAR(50) NULL,
ADD COLUMN gst_valid_from DATE NULL,
ADD COLUMN gst_rate VARCHAR(20) NULL;
```

---

## Step 2: Verify Migration

After running the migration, verify that all columns were added:

**PostgreSQL:**
```sql
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
```

**MySQL:**
```sql
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
```

You should see 25 columns listed.

---

## Step 3: Restart Backend Server

After running the migration, restart your backend server to ensure TypeORM picks up the new columns.

---

## Step 4: Test

1. Create a new company with all fields filled
2. Save the company
3. Edit the company and verify all fields are loaded correctly
4. Update the company and verify changes are saved

---

## Field Mapping Reference

### Frontend Form → Backend DTO → Database Column

| Frontend Field | Backend DTO Field | Database Column | Type |
|---------------|-------------------|-----------------|------|
| Registered Office Address | `regdOfficeAddress` | `regd_office_address` | TEXT |
| Admin Office Address | `adminOfficeAddress` | `admin_office_address` | TEXT |
| Factory Address | `factoryAddress` | `factory_address` | TEXT |
| Authorized Person Name | `authPersonName` | `auth_person_name` | VARCHAR(200) |
| Designation | `authPersonDesignation` | `auth_person_designation` | VARCHAR(200) |
| Date of Birth | `authPersonDOB` | `auth_person_dob` | DATE |
| PCB Auth Num | `pcbauthNum` | `pcb_auth_num` | VARCHAR(100) |
| Hazardous Waste Num | `hazardousWasteNum` | `hazardous_waste_num` | VARCHAR(100) |
| CTO Water Num | `ctoWaterNum` | `cto_water_num` | VARCHAR(100) |
| CTO Water Date | `ctoWaterDate` | `cto_water_date` | DATE |
| CTO Water Valid Upto | `ctoWaterValidUpto` | `cto_water_valid_upto` | DATE |
| CTO Air Num | `ctoAirNum` | `cto_air_num` | VARCHAR(100) |
| CTO Air Date | `ctoAirDate` | `cto_air_date` | DATE |
| CTO Air Valid Upto | `ctoAirValidUpto` | `cto_air_valid_upto` | DATE |
| CTE Water Num | `cteWaterNum` | `cte_water_num` | VARCHAR(100) |
| CTE Water Date | `cteWaterDate` | `cte_water_date` | DATE |
| CTE Water Valid Upto | `cteWaterValidUpto` | `cte_water_valid_upto` | DATE |
| CTE Air Num | `cteAirNum` | `cte_air_num` | VARCHAR(100) |
| CTE Air Date | `cteAirDate` | `cte_air_date` | DATE |
| CTE Air Valid Upto | `cteAirValidUpto` | `cte_air_valid_upto` | DATE |
| PCB Zone ID | `pcbZoneID` | `pcb_zone_id` | VARCHAR(50) |
| GST Valid From | `gstValidFrom` | `gst_valid_from` | DATE |
| GST Rate | `gstRate` | `gst_rate` | VARCHAR(20) |

---

## Backward Compatibility

✅ **All fields are nullable** - Existing companies will continue to work without any data loss
✅ **No breaking changes** - All existing APIs remain functional
✅ **Optional fields** - All new fields are optional, so existing code won't break

---

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** The migration scripts use `IF NOT EXISTS` checks, so this shouldn't happen. If it does, the columns already exist and you can skip the migration.

### Issue: Data not saving after migration
**Solution:** 
1. Verify columns exist using the verification queries above
2. Restart the backend server
3. Check backend logs for any errors
4. Verify the entity file doesn't have `select: false` on the new columns

### Issue: 500 error when loading companies
**Solution:** This was fixed by removing `select: false` from entity columns. If you still see this error, ensure the migration ran successfully and restart the backend server.

---

## Summary

After completing this migration:
- ✅ All 25 new fields will be saved correctly
- ✅ All fields will load correctly when editing companies
- ✅ No data loss for existing companies
- ✅ Backward compatible with existing APIs
- ✅ All form fields will work end-to-end
