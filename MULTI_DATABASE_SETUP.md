# Multi-Database Setup Guide

This project uses **separate databases** for different concerns to improve scalability, maintainability, and performance.

## Database Architecture

### 1. Master Database (`medi_waste_management_master`)
**Purpose**: Reference data and master records

**Contains**:
- Users
- Roles & Permissions
- Companies
- States
- Areas
- Categories
- PCB Zones
- Routes (master data)
- HCF Master
- Other reference/master data

### 2. Transaction Database (`medi_waste_management_transaction`)
**Purpose**: Operational and transactional data

**Contains**:
- Invoices
- Collections
- Route Assignments
- Waste Collections
- Barcode Generations
- Fleet Management
- Other operational transactions

### 3. Report Database (`medi_waste_management_report`)
**Purpose**: Reporting, analytics, and cached data

**Contains**:
- Report Logs
- Analytics Data
- Cached Reports
- Report Configurations
- Other reporting-related data

## Environment Variables

Create or update your `.env` file:

```env
# Master Database
MASTER_DB_HOST=localhost
MASTER_DB_PORT=5432
MASTER_DB_USERNAME=postgres
MASTER_DB_PASSWORD=your_password
MASTER_DB_DATABASE=medi_waste_management_master
MASTER_DB_SYNCHRONIZE=false
MASTER_DB_LOGGING=true

# Transaction Database
TRANSACTION_DB_HOST=localhost
TRANSACTION_DB_PORT=5432
TRANSACTION_DB_USERNAME=postgres
TRANSACTION_DB_PASSWORD=your_password
TRANSACTION_DB_DATABASE=medi_waste_management_transaction
TRANSACTION_DB_SYNCHRONIZE=false
TRANSACTION_DB_LOGGING=true

# Report Database
REPORT_DB_HOST=localhost
REPORT_DB_PORT=5432
REPORT_DB_USERNAME=postgres
REPORT_DB_PASSWORD=your_password
REPORT_DB_DATABASE=medi_waste_management_report
REPORT_DB_SYNCHRONIZE=false
REPORT_DB_LOGGING=true

# Fallback (if specific DB vars not set)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

## Database Setup

### Step 1: Create Databases

```sql
-- Connect to PostgreSQL
CREATE DATABASE medi_waste_management_master;
CREATE DATABASE medi_waste_management_transaction;
CREATE DATABASE medi_waste_management_report;
```

### Step 2: Run Migrations

```bash
# Master Database
npm run migration:run:master

# Transaction Database
npm run migration:run:transaction

# Report Database
npm run migration:run:report
```

## Module Organization

### Using Master Database

```typescript
// In module file
@Module({
  imports: [
    TypeOrmModule.forFeature([YourEntity], 'master'),
  ],
})

// In repository
constructor(
  @InjectRepository(YourEntity, 'master')
  private readonly repository: Repository<YourEntity>,
) {}
```

### Using Transaction Database

```typescript
// In module file
@Module({
  imports: [
    TypeOrmModule.forFeature([YourEntity], 'transaction'),
  ],
})

// In repository
constructor(
  @InjectRepository(YourEntity, 'transaction')
  private readonly repository: Repository<YourEntity>,
) {}
```

### Using Report Database

```typescript
// In module file
@Module({
  imports: [
    TypeOrmModule.forFeature([YourEntity], 'report'),
  ],
})

// In repository
constructor(
  @InjectRepository(YourEntity, 'report')
  private readonly repository: Repository<YourEntity>,
) {}
```

## Benefits

✅ **Isolation**: Each database is independent
✅ **Scalability**: Scale databases separately
✅ **Performance**: Smaller databases = faster queries
✅ **Maintenance**: Easier backups and migrations
✅ **Security**: Separate access controls
✅ **Microservices Ready**: Easy to split later

## Important Notes

⚠️ **No Cross-Database JOINs**: Use application-level joins
⚠️ **No Cross-Database Transactions**: Use saga pattern or eventual consistency
⚠️ **Connection Names**: Always specify connection name ('master', 'transaction', 'report')

## Migration Commands

```bash
# Generate migrations
npm run migration:generate:master -- -n CreateUsersTable
npm run migration:generate:transaction -- -n CreateInvoicesTable
npm run migration:generate:report -- -n CreateReportLogsTable

# Run migrations
npm run migration:run:master
npm run migration:run:transaction
npm run migration:run:report

# Revert migrations
npm run migration:revert:master
npm run migration:revert:transaction
npm run migration:revert:report
```
