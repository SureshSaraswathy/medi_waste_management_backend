-- Script to fix corrupted widget data in dashboard_configs table
-- This script fixes widgets stored as [[]] (array containing empty array) to []
-- Run this script in your PostgreSQL client connected to the report database
-- 
-- Usage:
-- psql -U postgres -d medi_waste_management_report -f scripts/fix_dashboard_widgets.sql
-- OR
-- Connect to the database and run the SQL commands below

-- Fix widgets that are stored as [[]] (array containing empty array)
-- This happens when widgets are saved incorrectly
UPDATE dashboard_configs
SET widgets = '[]'::jsonb
WHERE widgets::text = '[[]]'::text
   OR widgets::text = '[]'::text
   OR widgets IS NULL;

-- Fix widgets that are stored as arrays of arrays
-- Extract valid widget objects from nested arrays
UPDATE dashboard_configs
SET widgets = (
  SELECT COALESCE(
    jsonb_agg(elem),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(widgets) AS elem
  WHERE jsonb_typeof(elem) = 'object'
)
WHERE widgets IS NOT NULL
  AND jsonb_typeof(widgets) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(widgets) AS elem
    WHERE jsonb_typeof(elem) = 'array'
  );

-- Verify the fix
SELECT 
  id,
  role,
  jsonb_typeof(widgets) as widgets_type,
  jsonb_array_length(widgets) as widgets_count,
  widgets
FROM dashboard_configs
ORDER BY role;

-- Add comment
COMMENT ON COLUMN dashboard_configs.widgets IS 'Array of widget configuration objects. Must be an array of objects, not nested arrays.';
