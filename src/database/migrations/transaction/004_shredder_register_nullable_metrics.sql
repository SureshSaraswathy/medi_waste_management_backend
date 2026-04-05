-- =====================================================
-- Shredder Register: optional waste qty, temperature, pressure
-- Transaction Database Migration
-- =====================================================
-- Run this script in the medi_waste_management_transaction database

ALTER TABLE shredder_registers
  ALTER COLUMN waste_qty_kg DROP NOT NULL,
  ALTER COLUMN temperature_c DROP NOT NULL,
  ALTER COLUMN pressure_bar DROP NOT NULL;

COMMENT ON COLUMN shredder_registers.waste_qty_kg IS 'Waste quantity (kg); optional';
COMMENT ON COLUMN shredder_registers.temperature_c IS 'Temperature (°C); optional';
COMMENT ON COLUMN shredder_registers.pressure_bar IS 'Pressure (bar); optional';

-- =====================================================
-- Migration Complete
-- =====================================================
