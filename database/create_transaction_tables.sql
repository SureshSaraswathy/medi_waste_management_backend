-- Create Training Certificates table in transaction database
-- Run this script in the medi_waste_management_transaction database

CREATE TABLE IF NOT EXISTS training_certificates (
    certificate_id UUID PRIMARY KEY,
    certificate_no VARCHAR(100) NOT NULL,
    staff_name VARCHAR(200) NOT NULL,
    staff_code VARCHAR(50) NOT NULL,
    designation VARCHAR(100),
    hcf_id UUID NOT NULL,
    training_date DATE NOT NULL,
    company_id UUID NOT NULL,
    trained_by VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_certificates_status ON training_certificates(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_training_certificates_company_id ON training_certificates(company_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_training_certificates_hcf_id ON training_certificates(hcf_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_training_certificates_training_date ON training_certificates(training_date) WHERE is_deleted = false;

-- Create unique constraint for certificate_no and company_id combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_certificates_cert_no_company 
ON training_certificates(certificate_no, company_id) 
WHERE is_deleted = false;

-- Add comments
COMMENT ON TABLE training_certificates IS 'Stores training certificate records for staff members';
COMMENT ON COLUMN training_certificates.certificate_id IS 'Primary key - UUID';
COMMENT ON COLUMN training_certificates.certificate_no IS 'Unique certificate number';
COMMENT ON COLUMN training_certificates.staff_name IS 'Name of the staff member';
COMMENT ON COLUMN training_certificates.staff_code IS 'Code of the staff member';
COMMENT ON COLUMN training_certificates.designation IS 'Designation/role of the staff member';
COMMENT ON COLUMN training_certificates.hcf_id IS 'Reference to HCF (Health Care Facility)';
COMMENT ON COLUMN training_certificates.training_date IS 'Date when training was completed';
COMMENT ON COLUMN training_certificates.company_id IS 'Reference to company';
COMMENT ON COLUMN training_certificates.trained_by IS 'Name of trainer or training organization';
COMMENT ON COLUMN training_certificates.status IS 'Status: Active or Inactive';
COMMENT ON COLUMN training_certificates.is_deleted IS 'Soft delete flag';

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    contract_id UUID PRIMARY KEY,
    contract_id_display VARCHAR(100) NOT NULL,
    contract_num VARCHAR(200) NOT NULL,
    company_id UUID NOT NULL,
    hcf_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('Bed', 'Kg', 'Lumpsum')),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Expired')),
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_contracts_hcf_id ON contracts(hcf_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_contract_num_company 
ON contracts(contract_num, company_id) WHERE is_deleted = false;

COMMENT ON TABLE contracts IS 'Stores contract master records';
COMMENT ON COLUMN contracts.contract_id IS 'Primary key - UUID';
COMMENT ON COLUMN contracts.contract_id_display IS 'Display ID for contract';
COMMENT ON COLUMN contracts.contract_num IS 'Contract number';
COMMENT ON COLUMN contracts.company_id IS 'Reference to company';
COMMENT ON COLUMN contracts.hcf_id IS 'Reference to HCF';
COMMENT ON COLUMN contracts.billing_type IS 'Billing type: Bed, Kg, or Lumpsum';
COMMENT ON COLUMN contracts.status IS 'Status: Draft, Active, or Expired';

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
    agreement_id UUID PRIMARY KEY,
    agreement_id_display VARCHAR(100) NOT NULL,
    agreement_num VARCHAR(200) NOT NULL,
    contract_id UUID NOT NULL,
    agreement_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Generated', 'Signed')),
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_agreements_contract_id ON agreements(contract_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agreements_agreement_num_contract 
ON agreements(agreement_num, contract_id) WHERE is_deleted = false;

COMMENT ON TABLE agreements IS 'Stores agreement management records';
COMMENT ON COLUMN agreements.agreement_id IS 'Primary key - UUID';
COMMENT ON COLUMN agreements.agreement_id_display IS 'Display ID for agreement';
COMMENT ON COLUMN agreements.agreement_num IS 'Agreement number';
COMMENT ON COLUMN agreements.contract_id IS 'Reference to contract';
COMMENT ON COLUMN agreements.status IS 'Status: Draft, Generated, or Signed';

-- Agreement Clauses table
CREATE TABLE IF NOT EXISTS agreement_clauses (
    clause_id UUID PRIMARY KEY,
    agreement_clause_id_display VARCHAR(100) NOT NULL,
    agreement_id UUID NOT NULL,
    point_num VARCHAR(50) NOT NULL,
    point_title VARCHAR(200) NOT NULL,
    point_text TEXT NOT NULL,
    sequence_no INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_by UUID,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_agreement_clauses_status ON agreement_clauses(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_agreement_clauses_agreement_id ON agreement_clauses(agreement_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agreement_clauses_agreement_point 
ON agreement_clauses(agreement_id, point_num) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_agreement_clauses_agreement_sequence 
ON agreement_clauses(agreement_id, sequence_no) WHERE is_deleted = false;

COMMENT ON TABLE agreement_clauses IS 'Stores agreement clause records';
COMMENT ON COLUMN agreement_clauses.clause_id IS 'Primary key - UUID';
COMMENT ON COLUMN agreement_clauses.agreement_clause_id_display IS 'Display ID for clause';
COMMENT ON COLUMN agreement_clauses.agreement_id IS 'Reference to agreement';
COMMENT ON COLUMN agreement_clauses.point_num IS 'Point number (unique per agreement)';
COMMENT ON COLUMN agreement_clauses.point_title IS 'Title of the clause point';
COMMENT ON COLUMN agreement_clauses.point_text IS 'Text content of the clause';
COMMENT ON COLUMN agreement_clauses.sequence_no IS 'Display order sequence';
COMMENT ON COLUMN agreement_clauses.status IS 'Status: Active or Inactive';

-- =====================================================
-- Payment Management Tables
-- =====================================================
-- Note: These tables are created via migration file:
-- src/database/migrations/transaction/001_create_payment_tables.sql
-- Run that migration file to create these tables

-- Payments table (see migration file for full definition)
-- Stores payment records for invoice payments

-- Payment Allocations table (see migration file for full definition)
-- Tracks how payments are allocated to invoices (FIFO or manual)

-- Receipts table (see migration file for full definition)
-- Stores receipt records generated after payment processing

-- Receipt Invoice Mappings table (see migration file for full definition)
-- Maps receipts to invoices (many-to-many relationship)
