# Database Migrations

This directory contains database migrations organized by database type.

## Structure

```
migrations/
├── master/          # Migrations for Master Database
├── transaction/     # Migrations for Transaction Database
└── report/          # Migrations for Report Database
```

## Running Migrations

### Master Database
```bash
# Generate migration
npm run migration:generate:master -- -n MigrationName

# Run migrations
npm run migration:run:master

# Revert last migration
npm run migration:revert:master
```

### Transaction Database
```bash
# Generate migration
npm run migration:generate:transaction -- -n MigrationName

# Run migrations
npm run migration:run:transaction

# Revert last migration
npm run migration:revert:transaction
```

### Report Database
```bash
# Generate migration
npm run migration:generate:report -- -n MigrationName

# Run migrations
npm run migration:run:report

# Revert last migration
npm run migration:revert:report
```

## Database Assignment

- **Master Database**: Users, Roles, Companies, States, Areas, Categories, etc.
- **Transaction Database**: Invoices, Collections, Routes, Assignments, etc.
- **Report Database**: Report logs, Analytics, Cached reports, etc.
