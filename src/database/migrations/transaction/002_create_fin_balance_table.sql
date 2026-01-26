-- Create fin_balance table for Financial Balance Summary
CREATE TABLE IF NOT EXISTS fin_balance (
    fin_balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    hcf_id UUID NOT NULL,
    opening_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_manual BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_by UUID,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Unique constraint: one balance record per company-HCF combination
    CONSTRAINT uq_fin_balance_company_hcf UNIQUE (company_id, hcf_id) WHERE is_deleted = false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fin_balance_company_id ON fin_balance(company_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_fin_balance_hcf_id ON fin_balance(hcf_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_fin_balance_created_on ON fin_balance(created_on) WHERE is_deleted = false;

-- Add comments
COMMENT ON TABLE fin_balance IS 'Financial balance records for HCFs - tracks opening and current balances';
COMMENT ON COLUMN fin_balance.fin_balance_id IS 'Primary key - unique identifier for the balance record';
COMMENT ON COLUMN fin_balance.company_id IS 'Reference to company';
COMMENT ON COLUMN fin_balance.hcf_id IS 'Reference to HCF';
COMMENT ON COLUMN fin_balance.opening_balance IS 'Opening balance amount';
COMMENT ON COLUMN fin_balance.current_balance IS 'Current balance amount (updated on transactions)';
COMMENT ON COLUMN fin_balance.is_manual IS 'Flag indicating if record was created manually (true) or auto-generated (false)';
COMMENT ON COLUMN fin_balance.notes IS 'Optional notes for the balance record';
