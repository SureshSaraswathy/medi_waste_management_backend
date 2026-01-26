# Export Module - Reusable & Scalable Export System

## Overview

A common export API for all modules (Certificate, Staff, Reports, etc.) that provides PDF and Excel export functionality with validation, audit logging, and support for both synchronous and asynchronous exports.

## Architecture

### Key Principles

1. **Separation of Concerns**: Export logic does NOT contain:
   - DB queries (data is provided by modules)
   - Validation logic (handled by validators)
   - Business rules (delegated to modules)

2. **Reusability**: One common API for all modules

3. **Scalability**: Supports both sync (small data) and async (large data) exports

4. **Security**: Validation stops immediately if requirements are not met (no DB call, no file generation)

## Module Structure

```
export/
├── application/
│   ├── dto/
│   │   ├── export-request.dto.ts      # Request DTO with filters
│   │   └── export-response.dto.ts     # Response DTO
│   ├── validators/
│   │   └── export.validator.ts         # Common validation logic
│   └── services/
│       ├── export.service.ts          # Main export orchestration
│       ├── export-audit.service.ts   # Audit logging
│       └── export-data-provider-registry.service.ts  # Provider registry
├── domain/
│   └── interfaces/
│       └── export-data-provider.interface.ts  # Interface for module providers
├── infrastructure/
│   ├── generators/
│   │   ├── pdf.generator.ts           # PDF generation (template-based)
│   │   └── excel.generator.ts         # Excel generation (streaming)
│   └── providers/
│       └── certificate-export.provider.ts  # Example provider
├── presentation/
│   └── export.controller.ts           # Common export endpoint
└── export.module.ts
```

## Usage

### 1. API Endpoint

**POST** `/api/v1/export`

**Request Body:**
```json
{
  "module": "certificate",
  "fileType": "pdf",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "companyId": "uuid-here",
  "hcfId": "uuid-here",
  "status": "Active",
  "search": "keyword",
  "additionalFilters": []
}
```

**Response (Sync):**
- Returns file directly as download

**Response (Async):**
```json
{
  "success": true,
  "data": {
    "exportId": "export_1234567890_userId",
    "estimatedTime": 30,
    "recordCount": 50000
  },
  "message": "Export job created. You will be notified when ready."
}
```

### 2. Validation Rules

The system validates **before** any DB calls or file generation:

1. ✅ **Date From & Date To required**
2. ✅ **Max date range limit** (365 days default)
3. ✅ **At least one filter mandatory** (Company, HCF, Status, or Search)
4. ✅ **File type must be PDF or Excel**
5. ✅ **Module-specific validation** (permissions, company/HCF access)

### 3. Adding a New Module Export

To add export functionality for a new module:

#### Step 1: Create Data Provider

```typescript
import { Injectable } from '@nestjs/common';
import { ExportRequestDto } from '../../export/application/dto/export-request.dto';
import { IExportDataProvider } from '../../export/domain/interfaces/export-data-provider.interface';

@Injectable()
export class YourModuleExportProvider implements IExportDataProvider {
  constructor(
    // Inject your module's repository or use case
    private readonly yourRepository: IYourRepository,
  ) {}

  async getDataForExport(filters: ExportRequestDto): Promise<any[]> {
    // Use your module's existing data access layer
    return await this.yourRepository.findAll({
      companyId: filters.companyId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status,
      search: filters.search,
    });
  }

  async getEstimatedRecordCount(filters: ExportRequestDto): Promise<number> {
    // Fast COUNT query
    return await this.yourRepository.count({
      companyId: filters.companyId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status,
    });
  }

  getColumnDefinitions(): Array<{ key: string; label: string; width?: number }> {
    return [
      { key: 'id', label: 'ID', width: 120 },
      { key: 'name', label: 'Name', width: 150 },
      // ... more columns
    ];
  }

  transformRow?(row: any): any {
    // Optional: format dates, status, etc.
    return {
      ...row,
      createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '',
    };
  }
}
```

#### Step 2: Register Provider

In your module's `onModuleInit`:

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { ExportDataProviderRegistry } from '../export/application/services/export-data-provider-registry.service';
import { ExportModule } from '../export/export.module';
import { YourModuleExportProvider } from './providers/your-module-export.provider';
import { ExportModule as ExportModuleEnum } from '../export/application/dto/export-request.dto';

@Module({
  imports: [ExportModule],
  providers: [YourModuleExportProvider],
})
export class YourModule implements OnModuleInit {
  constructor(
    private readonly exportRegistry: ExportDataProviderRegistry,
    private readonly exportProvider: YourModuleExportProvider,
  ) {}

  onModuleInit() {
    // Register your provider
    this.exportRegistry.register(ExportModuleEnum.YOUR_MODULE, this.exportProvider);
  }
}
```

#### Step 3: Add Module to Enum

Add your module to `ExportModule` enum in `export-request.dto.ts`:

```typescript
export enum ExportModule {
  // ... existing modules
  YOUR_MODULE = 'your-module',
}
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# Export Configuration
EXPORT_MAX_DATE_RANGE_DAYS=365
EXPORT_MAX_RECORDS_FOR_SYNC=10000
```

### Limits

- **Max Date Range**: 365 days (configurable)
- **Sync Export Limit**: 10,000 records (configurable)
- **Async Export**: Automatically used for datasets > sync limit

## Audit Logging

Every export is logged with:
- Module name
- User ID
- Filters applied
- Record count
- File type
- File name
- Timestamp
- Duration (if available)

Logs are written to console (development) and should be saved to database (production).

## PDF Generation

Currently uses placeholder implementation. To implement actual PDF generation:

1. Install `pdfkit`:
   ```bash
   npm install pdfkit @types/pdfkit
   ```

2. Update `pdf.generator.ts` to use pdfkit for template-based PDF generation

## Excel Generation

Currently uses placeholder implementation. To implement actual Excel generation:

1. Install `exceljs`:
   ```bash
   npm install exceljs
   ```

2. Update `excel.generator.ts` to use exceljs with streaming support for large datasets

## Permissions

Add `EXPORT_VIEW` permission to your roles to allow export functionality.

## Error Handling

The system stops immediately if validation fails:
- No DB queries are executed
- No files are generated
- Clear error messages are returned

## Future Enhancements

1. **Async Export Queue**: Implement Bull/BullMQ for background job processing
2. **Email Notifications**: Notify users when async exports are ready
3. **Export Templates**: Customizable PDF/Excel templates per module
4. **Export History**: UI to view and re-download previous exports
5. **Scheduled Exports**: Cron-based automatic exports

## Example Frontend Integration

```typescript
const handleExport = async (fileType: 'pdf' | 'excel') => {
  const response = await fetch('/api/v1/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      module: 'certificate',
      fileType,
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      companyId: selectedCompanyId,
      status: selectedStatus,
    }),
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_export_${new Date().toISOString().split('T')[0]}.${fileType}`;
    a.click();
  }
};
```

## Testing

Test the export endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "module": "certificate",
    "fileType": "pdf",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "companyId": "your-company-id"
  }'
```
