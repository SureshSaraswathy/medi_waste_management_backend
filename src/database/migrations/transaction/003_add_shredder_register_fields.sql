-- =====================================================
-- Add New Fields to Shredder Register Table
-- Transaction Database Migration
-- =====================================================
-- Run this script in the medi_waste_management_transaction database

-- Add new columns to shredder_registers table
ALTER TABLE shredder_registers 
ADD COLUMN IF NOT EXISTS input_source_type VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS input_source_ref VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS input_qty_kg DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS output_qty_kg DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS blade_condition VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS output_dispatched_to VARCHAR(200) NULL;

-- Add comments for new columns
COMMENT ON COLUMN shredder_registers.input_source_type IS 'Type of input source for shredder operation';
COMMENT ON COLUMN shredder_registers.input_source_ref IS 'Reference number or identifier for input source';
COMMENT ON COLUMN shredder_registers.input_qty_kg IS 'Input quantity in kilograms';
COMMENT ON COLUMN shredder_registers.output_qty_kg IS 'Output quantity in kilograms after shredding';
COMMENT ON COLUMN shredder_registers.blade_condition IS 'Condition of shredder blades (Good, Fair, Poor, Needs Replacement)';
COMMENT ON COLUMN shredder_registers.output_dispatched_to IS 'Location or entity where output was dispatched';

-- =====================================================
-- Migration Complete
-- =====================================================
