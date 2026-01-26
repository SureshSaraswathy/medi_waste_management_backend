# Debug Guide: User Save & Retrieve Issues

## Check These Issues:

### 1. **API Endpoint Access**
- Check if `/api/v1/users/complete` endpoint is accessible
- Verify the backend server is running on port 3000
- Check browser console for network errors

### 2. **Authentication**
- Ensure authentication token is present in localStorage under `mw-auth-user`
- Check if token includes a `token` field
- Verify permissions include `USER_CREATE`

### 3. **Data Validation**
- Check browser console for validation errors
- Verify all required fields in Step 1 are filled:
  - Company Name
  - User Name
  - Mobile Number
  - Employee Code

### 4. **Transaction Issues**
- Check backend logs for transaction errors
- Verify database connection is working
- Check if tables exist: `users`, `user_employee_profiles`, `user_identity_compliance`, `user_addresses`

### 5. **Data Retrieval**
- Check if `loadUsers()` is being called after save
- Verify companies are loaded correctly
- Check if company IDs are valid UUIDs

## Console Logs to Check:

### Frontend Console (Browser):
- "Saving complete user data:" - Shows form data before save
- "Calling createCompleteUser with data:" - Shows API request data
- "User created successfully:" - Shows API response
- "Error saving user:" - Shows any errors

### Backend Console (Terminal):
- "CreateCompleteUserUseCase.execute called with:" - Shows received DTO
- "Transaction committed successfully. User ID:" - Shows successful save
- "Error in CreateCompleteUserUseCase - Transaction rolled back:" - Shows errors

## Quick Test Steps:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Fill out user form through all 5 steps
4. Click "Save & Complete" on Step 6
5. Check:
   - Network request to `/api/v1/users/complete`
   - Request payload (should contain all form data)
   - Response status (should be 201 Created)
   - Response body (should show success: true)
6. Check Console tab for any errors

## Common Issues:

1. **Missing Company**: If no companies loaded, create a company first
2. **Invalid UUID**: Company ID must be a valid UUID format
3. **Validation Errors**: Check backend response for validation error messages
4. **Transaction Failed**: Check database connection and table existence
5. **Permission Denied**: Ensure user has USER_CREATE permission
