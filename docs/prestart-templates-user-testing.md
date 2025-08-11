# Testing Guide: User Template Management

## Changes Made

### 1. Frontend Changes (`OrganizationPrestartTemplates.js`)
- ✅ Removed admin-only restriction 
- ✅ Added user permission checking (`canEditTemplate` function)
- ✅ Modified UI text to be inclusive of all users
- ✅ Added conditional rendering for edit/delete buttons
- ✅ Enhanced creator information display

### 2. Backend Changes (`/api/prestart/templates/`)
- ✅ Modified GET endpoint to allow all users to see organization templates
- ✅ Modified POST endpoint to allow users to create templates 
- ✅ Enhanced template creation with user information
- ✅ Updated PUT/DELETE permissions for template editing

## How to Test

### Test 1: As a Regular User (Non-Admin)

1. **Login as a regular user** (not admin)
2. **Navigate to Prestart Templates section**
   - Should see the templates interface (not the "only administrators" message)
   - Should see existing organization templates
   - Should see a "New Template" button

3. **Create a new template**:
   - Click "New Template"
   - Fill out template details:
     - Name: "My Custom Template"
     - Description: "Created by user test"
     - Add check items
   - Save template
   - **Expected**: Template should be created successfully
   - **Expected**: Template should show as "User Template" type
   - **Expected**: Template should show "Created by [username]"

4. **Edit your own template**:
   - Find the template you just created
   - Click edit button (should be visible)
   - Make changes and save
   - **Expected**: Changes should save successfully

5. **Try to edit someone else's template**:
   - Find a template created by another user or admin
   - **Expected**: Should see "View only" instead of edit/delete buttons

### Test 2: As an Admin User

1. **Login as an admin user**
2. **Navigate to Prestart Templates section**
3. **View all templates**:
   - **Expected**: Should see all templates (Global, Organization, User)
   - **Expected**: Should be able to edit ANY template in the organization
   - **Expected**: Should see edit/delete buttons on all organization templates

4. **Create admin template**:
   - Create a new template
   - **Expected**: Should show as "Organization Template"
   - **Expected**: Should show "Created by [admin name] - Administrator"

### Test 3: Cross-User Visibility

1. **User A creates a template**
2. **User B (same organization) logs in**
3. **User B should see User A's template** but only as "View only"
4. **Admin should see User A's template** and be able to edit it

## Expected Behavior

### Template Types:
- **Global Template**: Created by SUPER_ADMIN, visible to everyone
- **Organization Template**: Created by ADMIN, editable by org admins
- **User Template**: Created by regular user, editable only by creator and org admins

### Permissions Matrix:

| User Role | Can Create | Can Edit Own | Can Edit Others | Can Edit Org Templates | Can Delete Own | Can Delete Others |
|-----------|------------|--------------|-----------------|----------------------|----------------|------------------|
| User      | ✅ Yes      | ✅ Yes        | ❌ No            | ❌ No                 | ✅ Yes          | ❌ No             |
| Admin     | ✅ Yes      | ✅ Yes        | ✅ Yes (org only) | ✅ Yes                | ✅ Yes          | ✅ Yes (org only) |
| Super Admin| ✅ Yes     | ✅ Yes        | ✅ Yes (all)      | ✅ Yes                | ✅ Yes          | ✅ Yes (all)      |

## Verification Points

### Database Structure
Each template should have:
```javascript
{
  name: "Template Name",
  description: "Description",
  checkItems: [...],
  userId: "creator_user_id",
  organizationId: "org_id", 
  organizationName: "Org Name",
  createdByAdmin: true/false,
  createdByUser: "User Name",
  createdByUserId: "user_id",
  isGlobal: true/false,
  createdAt: Date
}
```

### API Endpoints
- `GET /api/prestart/templates` - All users can access
- `POST /api/prestart/templates` - All authenticated users can access
- `PUT /api/prestart/templates/[id]` - Owner + org admins can access
- `DELETE /api/prestart/templates/[id]` - Owner + org admins can access

## Troubleshooting

### If users can't see templates:
1. Check user session has `organizationId`
2. Verify database query includes user's organization
3. Check console for authentication errors

### If users can't create templates:
1. Verify user is authenticated
2. Check API response for validation errors
3. Ensure required template fields are provided

### If permissions are wrong:
1. Check `canEditTemplate` function logic
2. Verify backend permission checks in PUT/DELETE endpoints
3. Check user role and organization matching

## Success Criteria

- ✅ Regular users can create templates
- ✅ Regular users can edit their own templates
- ✅ Regular users can see all organization templates (read-only)
- ✅ Admins can edit all organization templates
- ✅ Templates show correct creator information
- ✅ UI shows appropriate edit/delete buttons based on permissions
- ✅ Backend enforces proper permission checks
