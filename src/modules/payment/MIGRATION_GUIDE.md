# Payment Module Database Migration Guide

## Overview

This guide explains how to run the database migration for the Payment module tables.

## Migration File

**Location:** `src/database/migrations/transaction/001_create_payment_tables.sql`

**Database:** `medi_waste_management_transaction`

## Tables Created

1. **payments** - Payment records
2. **payment_allocations** - Payment-to-invoice allocations (FIFO or manual)
3. **receipts** - Receipt records
4. **receipt_invoice_mappings** - Receipt-to-invoice mappings

## Running the Migration

### Method 1: Using psql (Recommended)

```bash
# Navigate to project root
cd medi_waste_management_backend

# Connect to transaction database
psql -U your_username -d medi_waste_management_transaction

# Run the migration
\i src/database/migrations/transaction/001_create_payment_tables.sql

# Verify tables were created
\dt payments
\dt payment_allocations
\dt receipts
\dt receipt_invoice_mappings
```

### Method 2: Using Database Client (pgAdmin, DBeaver, etc.)

1. Connect to `medi_waste_management_transaction` database
2. Open SQL Editor
3. Open file: `src/database/migrations/transaction/001_create_payment_tables.sql`
4. Execute the script (F5 or Execute button)

### Method 3: Command Line (One-liner)

```bash
psql -U your_username -d medi_waste_management_transaction -f src/database/migrations/transaction/001_create_payment_tables.sql
```

## Verification Queries

After running the migration, verify the tables:

```sql
-- Check table existence
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'payment_allocations', 'receipts', 'receipt_invoice_mappings')
ORDER BY table_name;

-- Check indexes
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('payments', 'payment_allocations', 'receipts', 'receipt_invoice_mappings')
ORDER BY tablename, indexname;

-- Check constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('payments', 'payment_allocations', 'receipts', 'receipt_invoice_mappings')
ORDER BY table_name;
```

## Rollback (If Needed)

To rollback the migration:

```sql
-- Drop tables in reverse order (due to dependencies)
DROP TABLE IF EXISTS receipt_invoice_mappings CASCADE;
DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
```

## Important Notes

1. **Foreign Keys**: The migration includes commented-out foreign key constraints. Uncomment them if you want to enforce referential integrity with the `invoices` table.

2. **UUID Generation**: Ensure PostgreSQL has the `uuid-ossp` extension enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Permissions**: Ensure the database user has CREATE TABLE and CREATE INDEX permissions.

4. **Backup**: Always backup your database before running migrations in production.

## Troubleshooting

### Error: "relation already exists"
- The tables already exist. Check if migration was already run.
- To re-run, drop tables first (see Rollback section).

### Error: "permission denied"
- Grant necessary permissions to the database user:
  ```sql
  GRANT CREATE ON DATABASE medi_waste_management_transaction TO your_username;
  ```

### Error: "extension uuid-ossp does not exist"
- Enable the extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```

## Next Steps

After running the migration:

1. Verify tables are created
2. Test the payment API endpoints
3. Test the frontend payment flow
4. Verify FIFO allocation logic
5. Test receipt generation

## Support

If you encounter any issues, check:
- Database connection settings in `.env`
- PostgreSQL version (should be 12+)
- User permissions
- Extension availability
