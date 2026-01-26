# Transaction Database Migrations

This directory contains SQL migration files for the transaction database (`medi_waste_management_transaction`).

## Payment Tables Migration

### File: `001_create_payment_tables.sql`

This migration creates the following tables for the payment management system:

1. **payments** - Stores payment records
2. **payment_allocations** - Tracks how payments are allocated to invoices (FIFO or manual)
3. **receipts** - Stores receipt records generated after payment
4. **receipt_invoice_mappings** - Maps receipts to invoices (many-to-many)

## Running the Migration

### Option 1: Using psql (PostgreSQL command line)

```bash
# Connect to the transaction database
psql -U your_username -d medi_waste_management_transaction

# Run the migration
\i src/database/migrations/transaction/001_create_payment_tables.sql
```

### Option 2: Using a database client (pgAdmin, DBeaver, etc.)

1. Connect to the `medi_waste_management_transaction` database
2. Open the SQL file: `001_create_payment_tables.sql`
3. Execute the script

### Option 3: Using Node.js script

Create a script to run the migration programmatically (similar to existing scripts in `/scripts` directory).

## Verification

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'payment_allocations', 'receipts', 'receipt_invoice_mappings');

-- Check table structure
\d payments
\d payment_allocations
\d receipts
\d receipt_invoice_mappings
```

## Rollback

To rollback this migration, run:

```sql
-- Drop tables in reverse order (due to dependencies)
DROP TABLE IF EXISTS receipt_invoice_mappings;
DROP TABLE IF EXISTS payment_allocations;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS payments;
```

## Notes

- All tables use UUID primary keys
- All tables have soft delete support (`is_deleted` flag)
- All tables have audit fields (`created_by`, `created_on`, `modified_by`, `modified_on`)
- Foreign key constraints are commented out - uncomment if you want to enforce referential integrity with the invoices table
- Indexes are created for performance optimization
