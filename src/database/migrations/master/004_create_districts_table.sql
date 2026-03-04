-- =====================================================
-- Districts Table - Master Database Migration
-- =====================================================
-- Districts table (Master Data)
CREATE TABLE IF NOT EXISTS districts (
  district_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_code VARCHAR(10) NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  state_id UUID NULL REFERENCES states(state_id),
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_by UUID,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by UUID,
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Unique constraint for district code (only for non-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_code_unique ON districts(district_code) WHERE is_deleted = false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_districts_status ON districts(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts(state_id) WHERE is_deleted = false;

-- Comments
COMMENT ON TABLE districts IS 'Master data table for districts';
COMMENT ON COLUMN districts.district_id IS 'Primary key UUID for district';
COMMENT ON COLUMN districts.district_code IS 'Unique code for the district (e.g., MUM, DEL)';
COMMENT ON COLUMN districts.district_name IS 'Full name of the district';
COMMENT ON COLUMN districts.state_id IS 'Foreign key reference to states table';
COMMENT ON COLUMN districts.status IS 'Status of the district: Active or Inactive';
COMMENT ON COLUMN districts.is_deleted IS 'Soft delete flag';
