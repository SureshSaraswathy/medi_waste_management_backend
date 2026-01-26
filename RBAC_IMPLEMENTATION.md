# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the RBAC implementation with SUPER_ADMIN bypass for the Medi Waste Management System.

## Architecture

### Backend Components

1. **PermissionsGuard** (`src/modules/auth/guards/permissions.guard.ts`)
   - Enforces permission checks on protected routes
   - SUPER_ADMIN bypass: Users with `*` permission or matching SUPER_ADMIN config bypass all checks
   - Environment-aware: Supports dev, UAT, and prod configurations

2. **PermissionService** (`src/modules/auth/services/permission.service.ts`)
   - Loads user permissions from database based on role
   - Caches permissions for performance (5-minute TTL)
   - SUPER_ADMIN detection: Checks userId, email, and username
   - Returns `['*']` for SUPER_ADMIN (wildcard = all permissions)

3. **AuthController** (`src/modules/auth/presentation/auth.controller.ts`)
   - `/auth/permissions` - GET endpoint to fetch user permissions
   - `/auth/menu-config` - GET endpoint to fetch menu configuration based on permissions

4. **JWT Token**
   - Includes `permissions` array in JWT payload
   - Permissions loaded during login and OTP verification
   - Stored in token for efficient access

### Frontend Components

1. **PermissionService** (`src/services/permissionService.ts`)
   - Fetches permissions and menu config from backend
   - Helper functions: `isSuperAdmin`, `hasPermission`, `canAccessMenu`

2. **Sidebar Component** (`src/components/layout/Sidebar.tsx`)
   - Dynamic menu rendering based on permissions
   - Fetches menu config on mount
   - Shows/hides menu items based on user permissions
   - No hardcoded permissions

## SUPER_ADMIN Configuration

SUPER_ADMIN is identified by:
1. **UserId**: Matches `SUPER_ADMIN_USER_ID` from config (default: `00000000-0000-0000-0000-000000000001`)
2. **Email**: Matches `SUPER_ADMIN_EMAIL` from config (default: `superadmin@medi-waste.io`)
3. **Username**: Matches `SUPER_ADMIN_USERNAME` from config (default: `superadmin`)
4. **Role**: Has `'superadmin'` in roles array

SUPER_ADMIN receives `['*']` permission (wildcard), which grants access to all resources.

## Environment Configuration

### Development
```env
NODE_ENV=development
SUPER_ADMIN_USER_ID=00000000-0000-0000-0000-000000000001
SUPER_ADMIN_EMAIL=superadmin@medi-waste.io
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_STATIC_OTP=123456
```

### UAT/Production
```env
NODE_ENV=production
SUPER_ADMIN_USER_ID=<production-super-admin-id>
SUPER_ADMIN_EMAIL=<production-super-admin-email>
SUPER_ADMIN_USERNAME=<production-super-admin-username>
SUPER_ADMIN_STATIC_OTP=<secure-otp>
```

## Permission Structure

Permissions follow the pattern: `{MODULE}_{ACTION}`

Examples:
- `USER_CREATE`, `USER_VIEW`, `USER_EDIT`, `USER_DELETE`
- `COMPANY_VIEW`, `COMPANY_CREATE`, `COMPANY_EDIT`, `COMPANY_DELETE`
- `HCF_VIEW`, `HCF_CREATE`, `HCF_EDIT`, `HCF_DELETE`
- `ROUTE_ASSIGNMENT_VIEW`, `ROUTE_ASSIGNMENT_CREATE`
- `WASTE_COLLECTION_VIEW`, `WASTE_COLLECTION_CREATE`

## Usage Examples

### Backend: Protect a Route

```typescript
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('hcf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HCFController {
  @Get()
  @RequirePermissions('HCF_VIEW')
  async findAll() {
    // Only users with HCF_VIEW permission can access
    // SUPER_ADMIN automatically has access
  }

  @Post()
  @RequirePermissions('HCF_CREATE')
  async create() {
    // Only users with HCF_CREATE permission can access
  }
}
```

### Frontend: Check Permission

```typescript
import { hasPermission, fetchUserPermissions } from '../services/permissionService';

const permissions = await fetchUserPermissions(user.token);
if (hasPermission(permissions, 'HCF_CREATE')) {
  // Show create button
}
```

### Frontend: Use Menu Config

```typescript
import { fetchMenuConfig, canAccessMenu } from '../services/permissionService';

const menuConfig = await fetchMenuConfig(user.token);
if (canAccessMenu(menuConfig, 'master', 'hcf')) {
  // Show HCF Master menu item
}
```

## Database Schema

Permissions are stored in:
- `permissions` table: Master list of all permissions
- `roles` table: User roles
- `role_permissions` table: Mapping between roles and permissions
- `users` table: Contains `user_role_id` reference

## Security Considerations

1. **SUPER_ADMIN Bypass**: Only applies to users matching SUPER_ADMIN config
2. **Permission Caching**: 5-minute TTL to balance performance and freshness
3. **JWT Tokens**: Permissions included in token to reduce database queries
4. **Environment Separation**: Different SUPER_ADMIN configs per environment
5. **No Hardcoded Permissions**: All permissions come from database or config

## Testing

### Test SUPER_ADMIN Access
1. Login as SUPER_ADMIN (email: `superadmin@medi-waste.io`, OTP: `123456`)
2. Verify permissions include `['*']`
3. Access all protected routes without permission errors

### Test Regular User Access
1. Login as regular user
2. Verify permissions loaded from database
3. Access only routes with required permissions
4. Verify menu items show/hide based on permissions

## Migration Notes

1. Ensure `permissions` table is populated with all required permissions
2. Ensure `role_permissions` table has mappings for all roles
3. Update environment variables for SUPER_ADMIN config
4. Frontend will automatically fetch permissions on login

## Future Enhancements

1. Permission groups/roles for easier management
2. Dynamic permission assignment UI
3. Permission audit logging
4. Fine-grained permission checks (e.g., company-scoped permissions)
