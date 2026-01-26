# Master Data Modules Implementation

## Overview
This document describes the implementation of master data modules following Clean Architecture principles with reusable patterns.

## Implemented Modules

### 1. State Master ✅
- **Path**: `src/modules/state/`
- **API Endpoint**: `/api/v1/states`
- **Fields**: stateCode, stateName, status
- **Unique Constraint**: stateCode
- **Permissions**: STATE_CREATE, STATE_VIEW, STATE_EDIT, STATE_DELETE

### 2. Area Master ✅
- **Path**: `src/modules/area/`
- **API Endpoint**: `/api/v1/areas`
- **Fields**: areaCode, areaName, areaPincode, status
- **Unique Constraint**: areaCode
- **Permissions**: AREA_CREATE, AREA_VIEW, AREA_EDIT, AREA_DELETE

### 3. Color Master ✅
- **Path**: `src/modules/color/`
- **API Endpoint**: `/api/v1/colors`
- **Fields**: colorName, companyId, status
- **Unique Constraint**: colorName + companyId (composite)
- **Permissions**: COLOR_CREATE, COLOR_VIEW, COLOR_EDIT, COLOR_DELETE

### 4. PCB Zone Master ⏳ (Template Created)
- **Path**: `src/modules/pcb-zone/`
- **API Endpoint**: `/api/v1/pcb-zones`
- **Fields**: pcbZoneName, pcbZoneAddress, contactNum, contactEmail, alertEmail, status
- **Unique Constraint**: pcbZoneName
- **Permissions**: PCB_ZONE_CREATE, PCB_ZONE_VIEW, PCB_ZONE_EDIT, PCB_ZONE_DELETE

### 5. Company Master ✅ (Already Exists)
- **Path**: `src/modules/company/`
- **API Endpoint**: `/api/v1/companies`
- **Status**: Already implemented, may need enhancement for additional fields

## Architecture Pattern

### Base Classes
- `BaseMasterEntity` - Common domain entity with status, audit fields
- `IBaseMasterRepository` - Common repository interface
- `MasterDataNotFoundException` - Base exception for not found
- `DuplicateMasterDataException` - Base exception for duplicates

### Module Structure
Each module follows this structure:
```
module-name/
├── domain/
│   ├── entities/
│   │   └── [name].domain.entity.ts
│   ├── interfaces/
│   │   └── [name].repository.interface.ts
│   └── exceptions/
│       └── [name].exceptions.ts
├── application/
│   ├── dto/
│   │   ├── create-[name].dto.ts
│   │   ├── update-[name].dto.ts
│   │   └── [name]-response.dto.ts
│   └── use-cases/
│       ├── create-[name].use-case.ts
│       ├── get-[name].use-case.ts
│       ├── get-all-[name]s.use-case.ts
│       ├── update-[name].use-case.ts
│       └── delete-[name].use-case.ts
├── infrastructure/
│   └── persistence/
│       ├── [name].entity.ts (TypeORM)
│       └── [name].repository.ts
├── presentation/
│   └── [name].controller.ts
└── [name].module.ts
```

## Features

### ✅ Error Handling
- Custom domain exceptions
- Validation using class-validator
- Proper HTTP status codes
- Meaningful error messages

### ✅ Process Handling
- Clean Architecture separation
- Dependency Injection
- Use Case pattern
- Repository pattern
- Soft delete support
- Audit trail (createdBy, modifiedBy, timestamps)

### ✅ Scalability
- Reusable base classes
- Consistent patterns across modules
- Easy to add new master modules
- Type-safe with TypeScript

### ✅ Security
- RBAC with permission guards
- Audit logging interceptor
- Input validation
- SQL injection protection (TypeORM)

## API Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

## Database Migration

Run the migration script:
```bash
psql -U postgres -d medi_waste_management_master -f scripts/create-master-tables.sql
```

Or use the Node.js script:
```bash
npm run migration:run:sql
```

## Next Steps

1. **Complete PCB Zone Master** - Follow the same pattern as State/Area/Color
2. **Enhance Company Master** - Add missing fields from frontend UI
3. **Add Integration Tests** - Test each module end-to-end
4. **Add Swagger Documentation** - Document all endpoints
5. **Frontend Integration** - Connect frontend to these APIs

## Usage Example

### Create State
```bash
POST /api/v1/states
Authorization: Bearer <token>
Content-Type: application/json

{
  "stateCode": "MH",
  "stateName": "Maharashtra"
}
```

### Get All Active States
```bash
GET /api/v1/states?activeOnly=true
Authorization: Bearer <token>
```

### Update State
```bash
PUT /api/v1/states/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Inactive"
}
```

### Delete State (Soft Delete)
```bash
DELETE /api/v1/states/{id}
Authorization: Bearer <token>
```
