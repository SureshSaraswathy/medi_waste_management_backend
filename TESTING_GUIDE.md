# API Testing Guide

## ✅ Authentication Fixed!

The `PermissionsGuard` has been updated to **automatically allow all requests in development mode** with a mock user that has all permissions. No authentication headers needed for testing!

## 🚀 Quick Start Testing

### Step 1: Get a Company ID

You need a valid Company ID (UUID) to create users. Run:

```powershell
npm run test:get-company-id
```

This will:
- Check if a test company exists
- Create one if it doesn't exist
- Display the Company ID to use

**Example Output:**
```
✅ Test Company Created:
   Company ID: 123e4567-e89b-12d3-a456-426614174000
   Company Code: COMP001
   Company Name: Test Company
```

### Step 2: Test in Postman

#### Create User Request

**Method:** `POST`  
**URL:** `http://localhost:3000/api/v1/users`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "companyId": "YOUR_COMPANY_ID_FROM_STEP_1",
  "userName": "test_user",
  "mobileNumber": "9876543210",
  "employeeCode": "EMP001"
}
```

**Expected Response (201 Created):**
```json
{
  "userId": "uuid-here",
  "companyId": "uuid-here",
  "userName": "test_user",
  "mobileNumber": "9876543210",
  "employeeCode": "EMP001",
  "userRoleId": null,
  "status": "Draft",
  "passwordEnabled": false,
  "otpEnabled": false,
  "forceOtpOnNextLogin": false,
  "webLogin": false,
  "mobileAppAccess": false,
  "createdBy": null,
  "createdOn": "2024-01-16T...",
  "modifiedBy": null,
  "modifiedOn": "2024-01-16T...",
  "isDeleted": false
}
```

## 📋 Available Endpoints

### 1. Health Check (No Auth Required)
```
GET http://localhost:3000/api/v1/health
```

### 2. Welcome Message (No Auth Required)
```
GET http://localhost:3000/api/v1
```

### 3. Create User
```
POST http://localhost:3000/api/v1/users
Body: {
  "companyId": "uuid",
  "userName": "test_user",
  "mobileNumber": "9876543210",
  "employeeCode": "EMP001",
  "userRoleId": "uuid" (optional)
}
```

### 4. Get User by ID
```
GET http://localhost:3000/api/v1/users/{userId}
```

### 5. Get Users by Company
```
GET http://localhost:3000/api/v1/users/company/{companyId}
```

### 6. Update User
```
PUT http://localhost:3000/api/v1/users/{userId}
Body: {
  "userName": "updated_name",
  "mobileNumber": "9876543211",
  "employeeCode": "EMP002"
}
```

### 7. Activate User
```
POST http://localhost:3000/api/v1/users/{userId}/activate
Body: {
  "passwordEnabled": true,
  "otpEnabled": false,
  "webLogin": true,
  "mobileAppAccess": true,
  "forceOtpOnNextLogin": false
}
```

### 8. Deactivate User
```
POST http://localhost:3000/api/v1/users/{userId}/deactivate
```

### 9. Delete User (Soft Delete)
```
DELETE http://localhost:3000/api/v1/users/{userId}
```

## 🔧 Testing with PowerShell

### Create User
```powershell
# First, get company ID
$companyId = (npm run test:get-company-id 2>&1 | Select-String -Pattern "Company ID: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value })

# Create user
$body = @{
    companyId = $companyId
    userName = "test_user"
    mobileNumber = "9876543210"
    employeeCode = "EMP001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/users" -Method Post -Body $body -ContentType "application/json"
```

### Get User
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/users/USER_ID" -Method Get
```

## 🧪 Testing with curl

```bash
# Get company ID first
COMPANY_ID=$(node scripts/get-company-id.js | grep "Company ID:" | awk '{print $3}')

# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": \"$COMPANY_ID\",
    \"userName\": \"test_user\",
    \"mobileNumber\": \"9876543210\",
    \"employeeCode\": \"EMP001\"
  }"
```

## ⚠️ Important Notes

1. **Development Mode Only**: The automatic authentication bypass only works when `NODE_ENV=development` (default).

2. **Production**: In production, you'll need to implement proper JWT authentication and attach the user to the request.

3. **Company ID Required**: You must use a valid UUID from the `companies` table. Use `npm run test:get-company-id` to get one.

4. **Validation Rules**:
   - `userName`: 3-100 characters, alphanumeric + underscore only
   - `mobileNumber`: Valid Indian mobile number format
   - `companyId`: Must be a valid UUID that exists in `companies` table

## 🐛 Troubleshooting

### Error: "Company ID must be a valid UUID"
- Make sure you're using a valid UUID format
- Run `npm run test:get-company-id` to get a valid company ID

### Error: "User with mobile number already exists"
- Each mobile number must be unique per company
- Try a different mobile number

### Error: "User with user name already exists"
- Each user name must be unique per company
- Try a different user name

### Still getting 403 Forbidden?
- Make sure the server is running in development mode
- Check that `NODE_ENV=development` in your `.env` file
- Restart the server after changes

## 📝 Example Complete Test Flow

1. **Start Server:**
   ```powershell
   npm run start:dev
   ```

2. **Get Company ID:**
   ```powershell
   npm run test:get-company-id
   # Copy the Company ID shown
   ```

3. **Create User in Postman:**
   - Method: POST
   - URL: `http://localhost:3000/api/v1/users`
   - Body: Use the Company ID from step 2

4. **Verify User Created:**
   - Copy the `userId` from the response
   - Test GET endpoint: `GET http://localhost:3000/api/v1/users/{userId}`

5. **Activate User:**
   - POST to `http://localhost:3000/api/v1/users/{userId}/activate`
   - Body: `{"passwordEnabled": true, "otpEnabled": false, "webLogin": true, "mobileAppAccess": true}`

## ✅ Success!

Your API is now ready for testing! All endpoints will work in development mode without requiring authentication tokens.
