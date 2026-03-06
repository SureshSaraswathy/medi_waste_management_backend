-- =====================================================
-- Finance Year Master Table - Master Database Migration
-- =====================================================
-- Finance Year Master table (Master Data)
CREATE TABLE IF NOT EXISTS finance_year_master (
  finance_year_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fin_year VARCHAR(7) NOT NULL, -- Format: YYYY-YY (e.g., 2025-26)
  fy_start_date DATE NOT NULL, -- Start date: 01-Apr-YYYY
  fy_end_date DATE NOT NULL, -- End date: 31-Mar-YYYY+1
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive'
  created_by VARCHAR(50),
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by VARCHAR(50),
  modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Unique constraint for finance year (only for non-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_year_unique ON finance_year_master(fin_year) WHERE is_deleted = false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_finance_year_status ON finance_year_master(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_finance_year_start_date ON finance_year_master(fy_start_date) WHERE is_deleted = false;

-- Comments
COMMENT ON TABLE finance_year_master IS 'Master data table for finance years';
COMMENT ON COLUMN finance_year_master.finance_year_id IS 'Primary key UUID for finance year';
COMMENT ON COLUMN finance_year_master.fin_year IS 'Finance year in YYYY-YY format (e.g., 2025-26)';
COMMENT ON COLUMN finance_year_master.fy_start_date IS 'Financial year start date (01-Apr-YYYY)';
COMMENT ON COLUMN finance_year_master.fy_end_date IS 'Financial year end date (31-Mar-YYYY+1)';
COMMENT ON COLUMN finance_year_master.status IS 'Status of the finance year: Active or Inactive';
COMMENT ON COLUMN finance_year_master.is_deleted IS 'Soft delete flag';
