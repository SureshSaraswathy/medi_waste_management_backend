# Dashboard Module

## Overview

The Dashboard Module provides read-only API endpoints for dashboard widgets and configuration management. **All dashboard APIs are read-only and do not modify business logic or business data.**

## Architecture

### Isolation Rules
- ✅ All queries are SELECT-only (no INSERT, UPDATE, DELETE)
- ✅ No modification to existing business logic
- ✅ No modification to existing database tables
- ✅ All APIs under `/api/v1/dashboard/*`
- ✅ Existing application behavior remains unchanged

### Module Structure
```
dashboard/
├── dashboard.controller.ts      # Main API controller
├── dashboard.service.ts         # Configuration management
├── dashboard.module.ts          # Module definition
├── dto/                         # Data Transfer Objects
│   ├── dashboard-config.dto.ts
│   ├── dashboard-kpi.dto.ts
│   ├── dashboard-chart.dto.ts
│   ├── dashboard-table.dto.ts
│   └── dashboard-catalog.dto.ts
└── services/                    # Business logic services
    ├── dashboard-kpi.service.ts
    ├── dashboard-chart.service.ts
    ├── dashboard-table.service.ts
    ├── dashboard-task.service.ts
    └── dashboard-catalog.service.ts
```

## API Endpoints

### KPI Endpoints (Read-Only)
- `GET /api/v1/dashboard/kpi/total-invoices` - Total invoices count
- `GET /api/v1/dashboard/kpi/pending-invoices` - Pending invoices count
- `GET /api/v1/dashboard/kpi/total-revenue` - Total revenue
- `GET /api/v1/dashboard/kpi/pending-payments` - Pending payments count
- `GET /api/v1/dashboard/kpi/receipts-today` - Receipts generated today
- `GET /api/v1/dashboard/kpi/active-users` - Active users count
- `GET /api/v1/dashboard/kpi/errors-today` - Errors logged today

**Response Format:**
```json
{
  "success": true,
  "data": {
    "label": "Pending Invoices",
    "value": 38,
    "trend": -4,
    "format": "number"
  }
}
```

### Chart Endpoints (Read-Only)
- `GET /api/v1/dashboard/chart/monthly-revenue` - Monthly revenue trend
- `GET /api/v1/dashboard/chart/payment-status` - Payment status distribution
- `GET /api/v1/dashboard/chart/invoice-aging` - Invoice aging analysis
- `GET /api/v1/dashboard/chart/daily-trips` - Daily trips chart
- `GET /api/v1/dashboard/chart/training-status` - Training status distribution
- `GET /api/v1/dashboard/chart/audit-issues-trend` - Audit issues trend

**Response Format:**
```json
{
  "success": true,
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "data": [120000, 135000, 128000],
    "metadata": {
      "total": 383000,
      "period": "2024"
    }
  }
}
```

### Table Endpoints (Read-Only)
- `GET /api/v1/dashboard/table/recent-invoices?limit=10` - Recent invoices list
- `GET /api/v1/dashboard/table/recent-payments?limit=10` - Recent payments list
- `GET /api/v1/dashboard/table/pending-receipts?limit=10` - Pending receipts list
- `GET /api/v1/dashboard/table/audit-logs?limit=10` - Audit logs list
- `GET /api/v1/dashboard/table/assigned-trips?limit=10` - Assigned trips list

**Response Format:**
```json
{
  "success": true,
  "data": {
    "columns": ["Invoice Number", "Date", "HCF", "Amount", "Status"],
    "rows": [
      {
        "Invoice Number": "INV-2024-001",
        "Date": "2024-01-15",
        "HCF": "uuid-here",
        "Amount": 50000,
        "Status": "Generated"
      }
    ],
    "total": 1
  }
}
```

### Task/Alert Endpoints (Read-Only)
- `GET /api/v1/dashboard/tasks/pending-approvals` - Pending approvals list
- `GET /api/v1/dashboard/tasks/assigned?userId=xxx` - Assigned tasks
- `GET /api/v1/dashboard/alerts/payment-overdue` - Payment overdue alerts
- `GET /api/v1/dashboard/alerts/compliance-expiry` - Compliance expiry alerts

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-123",
      "title": "Approve Invoice INV-2024-001",
      "description": "Invoice for 50000 INR",
      "priority": "high",
      "dueDate": "2024-01-20",
      "status": "pending"
    }
  ]
}
```

### Catalog Endpoint
- `GET /api/v1/dashboard/catalog` - Get catalog of all available dashboard APIs

**Response Format:**
```json
{
  "success": true,
  "data": {
    "kpis": [
      {
        "code": "PENDING_INVOICES",
        "title": "Pending Invoices",
        "api": "/api/v1/dashboard/kpi/pending-invoices",
        "format": "number",
        "roles": ["Accountant", "Manager"],
        "description": "Count of invoices pending approval"
      }
    ],
    "charts": [...],
    "tables": [...],
    "tasks": [...],
    "alerts": [...]
  }
}
```

### Configuration Endpoints
- `GET /api/v1/dashboard/config/:role` - Get dashboard config for role
- `GET /api/v1/dashboard/config?target=ROLE_OR_DEPT` - Get config by target
- `PUT /api/v1/dashboard/config/:role` - Update dashboard config (SuperAdmin only)
- `POST /api/v1/dashboard/config` - Create/update config (SuperAdmin only)
- `GET /api/v1/dashboard/roles` - Get available roles
- `GET /api/v1/dashboard/user-overrides/:userId` - Get user permission overrides

## Security

### Authentication & Authorization
- All endpoints require JWT authentication (`JwtAuthGuard`)
- All endpoints require permission checks (`PermissionsGuard`)
- Configuration write operations require `DASHBOARD_CONFIG_UPDATE` permission
- Read operations require `DASHBOARD_VIEW` permission

### Role-Based Access
- KPI, Chart, and Table endpoints respect role-based access
- Catalog endpoint lists APIs available to each role
- Configuration endpoints are restricted to SuperAdmin

## Data Sources

### Read-Only Queries
All dashboard services perform read-only queries on:
- `InvoiceEntity` (transaction database)
- `PaymentEntity` (transaction database)
- Future: User, Audit Log, Training Certificate, etc.

### No Business Logic Modification
- ✅ No invoice creation/modification
- ✅ No payment processing
- ✅ No status updates
- ✅ No data deletion
- ✅ Only aggregated/read-only data retrieval

## Future Enhancements

1. **Database Storage for Configuration**
   - Store dashboard configurations in database
   - Support versioning
   - Audit trail for configuration changes

2. **Additional Data Sources**
   - User table for active users count
   - Audit log table for audit-related endpoints
   - Training certificate table for training status
   - Waste collection tables for trip data

3. **Performance Optimization**
   - Caching for frequently accessed KPIs
   - Materialized views for complex aggregations
   - Query optimization for large datasets

4. **Real-time Updates**
   - WebSocket support for live dashboard updates
   - Event-driven data refresh

## Notes

- **All queries are SELECT-only** - No data modification
- **Isolated from business logic** - No impact on existing features
- **Production-ready** - Includes error handling and validation
- **Extensible** - Easy to add new KPIs, charts, and tables
