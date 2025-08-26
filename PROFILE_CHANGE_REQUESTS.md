# Profile Change Request System

This system allows employees to request changes to their profile information, which must be approved by their direct manager before being applied.

## Features

### For Employees
- **Request Profile Changes**: Instead of directly editing profile information, employees can now request changes
- **Add Comments**: Employees can provide explanations for their requested changes
- **Track Request Status**: View the status of all their change requests (pending, approved, rejected)
- **Request History**: Complete history of all profile change requests with manager comments

### For Managers
- **Review Requests**: View all pending profile change requests from their direct reports
- **Approve/Reject**: Managers can approve or reject requests with optional comments
- **Automatic Application**: When approved, changes are automatically applied to the employee's profile
- **Dashboard Integration**: Profile change requests are displayed in the manager dashboard

## How It Works

### 1. Employee Requests Changes
1. Employee goes to their profile page
2. Clicks "Edit Profile" to make changes
3. Instead of "Save Changes", they click "Request Changes"
4. A dialog opens showing the requested changes and allowing them to add a comment
5. Request is submitted to their direct manager

### 2. Manager Reviews Requests
1. Manager sees pending requests in their dashboard
2. For each request, they can see:
   - Employee name
   - Requested changes
   - Employee's comment
   - Request date
3. Manager can approve or reject with optional comments

### 3. Automatic Application
- When approved, changes are automatically applied to the employee's profile
- Employee receives notification of approval/rejection
- All actions are logged with timestamps and user information

## API Endpoints

### Create Change Request
```
POST /api/odoo/auth/profile/request-changes
Body: { uid, changes, comment }
```

### Get Pending Requests (Managers)
```
POST /api/odoo/auth/profile/pending-requests
Body: { uid }
```

### Approve Request
```
PUT /api/odoo/auth/profile/approve-changes/[id]
Body: { uid, comment }
```

### Reject Request
```
PUT /api/odoo/auth/profile/reject-changes/[id]
Body: { uid, comment }
```

### Get Request History (Employees)
```
POST /api/odoo/auth/profile/request-history
Body: { uid }
```

## Odoo Model

The system uses a custom Odoo model `hr.profile.change.request` with the following fields:

- `employee_id`: The employee requesting changes
- `manager_id`: The manager who needs to approve
- `requested_changes`: JSON string of the requested changes
- `comment`: Employee's comment explaining the request
- `state`: Status (pending, approved, rejected)
- `request_date`: When the request was submitted
- `approved_date`/`rejected_date`: When the request was processed
- `approved_by`/`rejected_by`: Who processed the request
- `approval_comment`/`rejection_comment`: Manager's comments

## Security

- Only direct managers can approve/reject requests for their employees
- All actions are logged with user information
- Changes are only applied after explicit approval
- Validation ensures proper manager-employee relationships

## UI Components

### Employee Profile Page
- Modified to show "Request Changes" instead of "Save Changes"
- Added dialog for submitting change requests
- New "Change Requests" tab showing request history

### Manager Dashboard
- Added profile change requests section
- Shows pending requests with approve/reject buttons
- Displays request details and employee comments

## Installation

1. Add the Odoo model file to your Odoo modules
2. Update the database schema
3. The API endpoints are already integrated into the application
4. UI components are ready to use

## Usage Example

1. **Employee requests change**:
   - Edit profile information
   - Click "Request Changes"
   - Add comment: "Updated my phone number"
   - Submit request

2. **Manager receives notification**:
   - Sees request in dashboard
   - Reviews changes and comment
   - Approves with comment: "Approved - contact info updated"

3. **Employee sees result**:
   - Request shows as "Approved" in history
   - Profile is automatically updated
   - Can see manager's approval comment 