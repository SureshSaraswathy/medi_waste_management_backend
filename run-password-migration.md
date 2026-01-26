# Run Password Fields Migration

## Quick Fix: Add Password Fields to Users Table

The migration file has been created at:
`src/database/migrations/master/002_add_password_fields_to_users.sql`

## Option 1: Run via psql (PostgreSQL Command Line)

```bash
# Connect to your database
psql -h localhost -U postgres -d medi_waste_management_master

# Run the migration
\i src/database/migrations/master/002_add_password_fields_to_users.sql

# Or directly:
psql -h localhost -U postgres -d medi_waste_management_master -f src/database/migrations/master/002_add_password_fields_to_users.sql
```

## Option 2: Run via pgAdmin or Database Tool

1. Open pgAdmin or your preferred database tool
2. Connect to your `medi_waste_management_master` database
3. Open the SQL file: `src/database/migrations/master/002_add_password_fields_to_users.sql`
4. Execute the SQL script

## Option 3: Run via Node.js Script

Create a temporary script to run the migration:

```javascript
// run-migration.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: process.env.MASTER_DB_PORT || 5432,
  user: process.env.MASTER_DB_USERNAME || 'postgres',
  password: process.env.MASTER_DB_PASSWORD || 'admin',
  database: process.env.MASTER_DB_DATABASE || 'medi_waste_management_master',
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'src/database/migrations/master/002_add_password_fields_to_users.sql'),
      'utf8'
    );
    
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
```

Then run:
```bash
node run-migration.js
```

## What the Migration Does

The migration adds the following columns to the `users` table:

1. **password_hash** (VARCHAR(255), NULL) - Stores BCrypt hashed passwords
2. **force_password_change** (BOOLEAN, DEFAULT false) - Flag to force password change on next login
3. **temporary_password** (VARCHAR(255), NULL) - Temporary password (plain text, stored temporarily)
4. **temporary_password_expiry** (TIMESTAMP, NULL) - Expiry timestamp for temporary password

## Verify Migration

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('password_hash', 'force_password_change', 'temporary_password', 'temporary_password_expiry');
```

You should see all 4 columns listed.
