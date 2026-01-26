-- =====================================================
-- Payment Management System - Database Schema
-- Transaction Database Migration
-- =====================================================
-- Run this script in the medi_waste_management_transaction database

-- 1. Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash', 'Cheque', 'Bank Transfer', 'UPI', 'NEFT', 'RTGS', 'Other')),
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    notes TEXT,
    receipt_id UUID,
    created_by UUID,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_company_date ON payments(company_id, payment_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_payments_receipt_id ON payments(receipt_id) WHERE is_deleted = false;

-- Comments for payments table
COMMENT ON TABLE payments IS 'Stores payment records for invoice payments';
COMMENT ON COLUMN payments.payment_id IS 'Primary key - UUID';
COMMENT ON COLUMN payments.company_id IS 'Reference to company';
COMMENT ON COLUMN payments.payment_date IS 'Date when payment was made';
COMMENT ON COLUMN payments.payment_amount IS 'Total payment amount';
COMMENT ON COLUMN payments.payment_mode IS 'Payment mode: Cash, Cheque, Bank Transfer, UPI, NEFT, RTGS, Other';
COMMENT ON COLUMN payments.reference_number IS 'Transaction/reference number for non-cash payments';
COMMENT ON COLUMN payments.bank_name IS 'Bank name for cheque/bank transfer';
COMMENT ON COLUMN payments.cheque_number IS 'Cheque number for cheque payments';
COMMENT ON COLUMN payments.cheque_date IS 'Cheque date for cheque payments';
COMMENT ON COLUMN payments.status IS 'Payment status: Pending, Completed, Cancelled';
COMMENT ON COLUMN payments.notes IS 'Payment notes or remarks';
COMMENT ON COLUMN payments.receipt_id IS 'Reference to receipt generated for this payment';
COMMENT ON COLUMN payments.is_deleted IS 'Soft delete flag';

-- 2. Payment Allocations table
CREATE TABLE IF NOT EXISTS payment_allocations (
    allocation_id UUID PRIMARY KEY,
    payment_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    allocated_amount DECIMAL(12, 2) NOT NULL,
    allocation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for payment_allocations table
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations(payment_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice_id ON payment_allocations(invoice_id) WHERE is_deleted = false;

-- Comments for payment_allocations table
COMMENT ON TABLE payment_allocations IS 'Stores payment allocation to invoices (FIFO or manual allocation)';
COMMENT ON COLUMN payment_allocations.allocation_id IS 'Primary key - UUID';
COMMENT ON COLUMN payment_allocations.payment_id IS 'Reference to payment';
COMMENT ON COLUMN payment_allocations.invoice_id IS 'Reference to invoice';
COMMENT ON COLUMN payment_allocations.allocated_amount IS 'Amount allocated from payment to this invoice';
COMMENT ON COLUMN payment_allocations.allocation_date IS 'Date when allocation was made';
COMMENT ON COLUMN payment_allocations.is_deleted IS 'Soft delete flag';

-- 3. Receipts table
CREATE TABLE IF NOT EXISTS receipts (
    receipt_id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_id UUID NOT NULL,
    notes TEXT,
    financial_year VARCHAR(10) NOT NULL,
    sequence_number INTEGER NOT NULL,
    created_by UUID,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    modified_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for receipts table
CREATE INDEX IF NOT EXISTS idx_receipts_company_date ON receipts(company_id, receipt_date) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_financial_year ON receipts(financial_year) WHERE is_deleted = false;

-- Comments for receipts table
COMMENT ON TABLE receipts IS 'Stores receipt records generated after payment processing';
COMMENT ON COLUMN receipts.receipt_id IS 'Primary key - UUID';
COMMENT ON COLUMN receipts.company_id IS 'Reference to company';
COMMENT ON COLUMN receipts.receipt_number IS 'Unique receipt number (Format: RCPT-YYYYYY-0001)';
COMMENT ON COLUMN receipts.receipt_date IS 'Date when receipt was generated';
COMMENT ON COLUMN receipts.total_amount IS 'Total amount in receipt';
COMMENT ON COLUMN receipts.payment_id IS 'Reference to payment';
COMMENT ON COLUMN receipts.notes IS 'Receipt notes or remarks';
COMMENT ON COLUMN receipts.financial_year IS 'Financial year (Format: 2024-25)';
COMMENT ON COLUMN receipts.sequence_number IS 'Sequence number for receipt numbering within financial year';
COMMENT ON COLUMN receipts.is_deleted IS 'Soft delete flag';

-- 4. Receipt Invoice Mappings table
CREATE TABLE IF NOT EXISTS receipt_invoice_mappings (
    mapping_id UUID PRIMARY KEY,
    receipt_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    allocated_amount DECIMAL(12, 2) NOT NULL,
    created_by UUID,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for receipt_invoice_mappings table
CREATE INDEX IF NOT EXISTS idx_receipt_invoice_mappings_receipt_id ON receipt_invoice_mappings(receipt_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipt_invoice_mappings_invoice_id ON receipt_invoice_mappings(invoice_id) WHERE is_deleted = false;

-- Comments for receipt_invoice_mappings table
COMMENT ON TABLE receipt_invoice_mappings IS 'Maps receipts to invoices (many-to-many relationship)';
COMMENT ON COLUMN receipt_invoice_mappings.mapping_id IS 'Primary key - UUID';
COMMENT ON COLUMN receipt_invoice_mappings.receipt_id IS 'Reference to receipt';
COMMENT ON COLUMN receipt_invoice_mappings.invoice_id IS 'Reference to invoice';
COMMENT ON COLUMN receipt_invoice_mappings.allocated_amount IS 'Amount allocated from receipt to this invoice';
COMMENT ON COLUMN receipt_invoice_mappings.is_deleted IS 'Soft delete flag';

-- =====================================================
-- Foreign Key Constraints (if invoices table exists)
-- =====================================================
-- Note: These foreign keys are optional and depend on whether the invoices table exists
-- Uncomment if you want to enforce referential integrity

-- ALTER TABLE payment_allocations 
-- ADD CONSTRAINT fk_payment_allocations_invoice 
-- FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id);

-- ALTER TABLE receipt_invoice_mappings 
-- ADD CONSTRAINT fk_receipt_invoice_mappings_invoice 
-- FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id);

-- =====================================================
-- Migration Complete
-- =====================================================
