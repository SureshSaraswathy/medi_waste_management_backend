# Notification Module

Enterprise MES-style notification system for role-based notifications.

## Features

- Role-based and user-based notification delivery
- Priority levels (LOW, MEDIUM, HIGH, CRITICAL)
- Notification types (INFO, WARNING, ERROR, APPROVAL, ALERT)
- Module-based categorization
- Read/unread tracking
- Auto-refresh frontend (30 seconds)

## Database Schema

### notifications
- `id` (uuid) - Primary key
- `title` (varchar) - Notification title
- `message` (text) - Notification message
- `type` (enum) - INFO, WARNING, ERROR, APPROVAL, ALERT
- `module` (varchar) - Module name (invoice, downtime, compliance, etc.)
- `reference_id` (uuid) - Reference to entity (optional)
- `created_by` (uuid) - User who created the notification
- `created_at` (timestamp) - Creation timestamp

### notification_receivers
- `id` (uuid) - Primary key
- `notification_id` (uuid) - Foreign key to notifications
- `user_id` (uuid) - Direct user recipient (nullable)
- `role_id` (uuid) - Role-based recipient (nullable)
- `is_read` (boolean) - Read status
- `read_at` (timestamp) - Read timestamp
- `priority` (enum) - LOW, MEDIUM, HIGH, CRITICAL

## Usage

### Creating Notifications

```typescript
// In any service, inject NotificationHelperService
constructor(
  private readonly notificationHelper: NotificationHelperService,
) {}

// Notify by roles
await this.notificationHelper.notifyRoles(
  'Title',
  'Message',
  'module-name',
  ['role-id-1', 'role-id-2'],
  {
    referenceId: 'entity-id',
    type: NotificationType.ALERT,
    priority: NotificationPriority.HIGH,
    createdBy: userId,
  }
);

// Notify by users
await this.notificationHelper.notifyUsers(
  'Title',
  'Message',
  'module-name',
  ['user-id-1', 'user-id-2'],
  {
    referenceId: 'entity-id',
    type: NotificationType.INFO,
    priority: NotificationPriority.MEDIUM,
  }
);
```

## Notification Rules

### Invoice Module
- Accountant creates invoice → Manager gets approval notification
- Payment pending → Accountant + Manager

### Downtime Module
- Machine breakdown created → Supervisor + Manager
- Downtime > 2 hrs → Manager HIGH priority
- Downtime > 4 hrs → FactoryIncharge CRITICAL

### Compliance Module
- Certificate expiry in 7 days → Compliance role
- Expired → Manager + PCB

### Training Module
- Training assigned → Employee role
- Training overdue → Supervisor

## API Endpoints

- `GET /notifications/my` - Get user's notifications
- `GET /notifications/unread-count` - Get unread count
- `POST /notifications/read/:id` - Mark receiver as read
- `POST /notifications/read-all` - Mark all as read

## Frontend Integration

The NotificationBell component is integrated into the dashboard header. It:
- Shows unread count badge
- Opens side panel on click
- Groups notifications by Today/Yesterday/Earlier
- Auto-refreshes every 30 seconds
- Navigates to module page on click

## TODO: Role Resolution

Currently, notification triggers use placeholder role IDs. To complete the implementation:

1. Inject RoleRepository into NotificationHelperService
2. Create a method to resolve role names to IDs:
   ```typescript
   async resolveRoleIds(roleNames: string[]): Promise<string[]> {
     // Query roles table and return IDs
   }
   ```
3. Update notification triggers to use role names instead of IDs

## Migration

Run the migration to create the tables:
```bash
npm run migration:run
```
