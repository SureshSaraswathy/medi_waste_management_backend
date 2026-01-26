# Running Database Migrations on Windows

Since `psql` is not in your PATH, here are **3 easy ways** to run the migration:

## Option 1: Use Node.js Script (Recommended) ✅

I've created a Node.js script that will run the migration for you:

```powershell
cd medi_waste_management_backend
node scripts/run-migration.js
```

**Prerequisites:**
- Make sure your `.env` file has the correct database credentials
- The script will automatically read from your `.env` file

## Option 2: Use PostgreSQL GUI Tool

### Using pgAdmin:
1. Open **pgAdmin**
2. Connect to your PostgreSQL server
3. Right-click on `medi_waste_management_master` database
4. Select **Query Tool**
5. Open the file: `src/database/migrations/master/001_create_user_management_tables.sql`
6. Click **Execute** (F5)

### Using DBeaver or any SQL client:
1. Connect to your database
2. Open the SQL file
3. Execute the script

## Option 3: Find psql.exe and Use Full Path

PostgreSQL is usually installed in one of these locations:

```powershell
# Try these paths (replace version number):
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d medi_waste_management_master -f src/database/migrations/master/001_create_user_management_tables.sql

# Or if installed in Program Files (x86):
& "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe" -U postgres -d medi_waste_management_master -f src/database/migrations/master/001_create_user_management_tables.sql

# Or if installed via Chocolatey:
& "C:\tools\pgsql\bin\psql.exe" -U postgres -d medi_waste_management_master -f src/database/migrations/master/001_create_user_management_tables.sql
```

**To find your PostgreSQL installation:**
```powershell
Get-ChildItem -Path "C:\Program Files" -Filter "psql.exe" -Recurse -ErrorAction SilentlyContinue
Get-ChildItem -Path "C:\Program Files (x86)" -Filter "psql.exe" -Recurse -ErrorAction SilentlyContinue
```

## Option 4: Add PostgreSQL to PATH (Permanent Solution)

1. Find your PostgreSQL installation directory (usually `C:\Program Files\PostgreSQL\16\bin`)
2. Add it to your system PATH:
   - Press `Win + X` → **System** → **Advanced system settings**
   - Click **Environment Variables**
   - Under **System variables**, find **Path** → Click **Edit**
   - Click **New** → Add: `C:\Program Files\PostgreSQL\16\bin`
   - Click **OK** on all dialogs
3. Restart PowerShell
4. Now you can use `psql` directly

## Quick Test After Migration

After running the migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'companies', 'users', 'user_employee_profiles', 
  'user_identity_compliance', 'user_addresses', 
  'roles', 'permissions', 'role_permissions'
);

-- Check permissions were inserted
SELECT COUNT(*) FROM permissions;
-- Should return 25+
```

## Troubleshooting

### Error: "database does not exist"
Create the database first:
```sql
CREATE DATABASE medi_waste_management_master;
```

### Error: "password authentication failed"
Check your `.env` file has the correct password:
```env
MASTER_DB_PASSWORD=your_actual_password
```

### Error: "connection refused"
Make sure PostgreSQL service is running:
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*
```
