# User Management Module

Complete implementation of User Management with RBAC, following enterprise best practices.

## Architecture

- **Entity**: `user.entity.ts` - Database schema with UUID primary key
- **DTOs**: Input validation contracts (CreateUser, UpdateUser, ActivateUser)
- **Repository**: Pure data access layer (no business logic)
- **Service**: Business logic layer (UserService, UserActivationService)
- **Controller**: API endpoints with RBAC guards
- **Auth**: Permission-based authorization system

## Key Features

### ✅ User Entity
- UUID primary key (`userId`)
- Company-scoped uniqueness (mobile number, user name)
- Status enum (Draft, Active, Inactive)
- Soft delete support
- Timestamps (createdOn, modifiedOn)

### ✅ Business Rules
1. **User Creation**:
   - Created as `Draft` status
   - Login disabled (passwordEnabled = false, otpEnabled = false)
   - Company-scoped uniqueness for mobile number and user name

2. **User Activation**:
   - Only Draft users can be activated
   - Separate activation endpoint
   - Enables password/OTP based on flags
   - Changes status to Active

3. **User Deactivation**:
   - Disables login
   - Sets status to Inactive

### ✅ RBAC System
- Permission-based authorization (not role-based)
- Dynamic permission checking via `PermissionsGuard`
- Permission codes: `USER_CREATE`, `USER_VIEW`, `USER_EDIT`, `USER_DELETE`, `USER_ACTIVATE`, `USER_DEACTIVATE`
- No hardcoded role names

### ✅ API Endpoints

```
POST   /api/v1/users              - Create user (requires USER_CREATE)
GET    /api/v1/users/:id          - Get user (requires USER_VIEW)
PUT    /api/v1/users/:id          - Update user (requires USER_EDIT)
DELETE /api/v1/users/:id          - Delete user (requires USER_DELETE)
POST   /api/v1/users/:id/activate - Activate user (requires USER_ACTIVATE)
POST   /api/v1/users/:id/deactivate - Deactivate user (requires USER_DEACTIVATE)
GET    /api/v1/users/company/:companyId - Get all users by company (requires USER_VIEW)
```

### ✅ Error Handling
- Custom exceptions for business logic errors
- Centralized exception filter
- Meaningful error messages

### ✅ Audit Logging
- `AuditLogInterceptor` logs all user operations
- Logs: timestamp, userId, method, URL, params, sanitized body
- Success and error logging

## Database Migration

Run the following migration to create the users table:

```bash
npm run migration:generate -- -n CreateUsersTable
```

Or manually create the migration file with the schema from `user.entity.ts`.

## Permission Service Integration

The `PermissionService` needs to be integrated with your Role-Permission mapping:

1. Implement `loadUserPermissions()` to query your role-permission table
2. Cache permissions for performance
3. Call `buildUserPayload()` after successful login to attach permissions to JWT

## Usage Example

### Create User
```typescript
POST /api/v1/users
{
  "companyId": "uuid",
  "userName": "johndoe",
  "mobileNumber": "+919876543210",
  "employeeCode": "EMP001",
  "userRoleId": "uuid" // optional
}
```

### Activate User
```typescript
POST /api/v1/users/:id/activate
{
  "passwordEnabled": true,
  "otpEnabled": false
}
```

## Next Steps

1. **Implement Permission Loading**: Update `PermissionService.loadUserPermissions()` to query your role-permission mapping
2. **JWT Integration**: Attach permissions to JWT token after login
3. **Role Module**: Create Role and Permission entities if not already present
4. **Testing**: Add unit and integration tests
