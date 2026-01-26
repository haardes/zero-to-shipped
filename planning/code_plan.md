# Todo Tracking Application - Technical Implementation Plan

## Overview

A frontend todo tracking application built with Next.js, TypeScript, and Supabase, featuring user authentication and collaborative list sharing.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **State Management**: React Context
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **ORM**: Supabase Client

### Development
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## Project Structure

```
web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── lists/[id]/
│   ├── layout.tsx
│   └── page.tsx
├── types/
│   ├── database.ts
│   ├── todo.ts
│   └── user.ts
├── utils/
│   ├── supabase/
│   │   └── client.ts
│   └── validation.ts
└── components/
    ├── ui/
    ├── dashboard/
    ├── lists/
    └── items/
```


## Requirements (EARS Format)

### 1. User Authentication

**REQ-AUTH-001**: User Registration
WHEN a user visits /register
THE system SHALL display a registration form with email and password fields
WHERE password must be at least 8 characters with one uppercase, one lowercase, and one number

**REQ-AUTH-002**: Password Hashing
WHEN a user submits registration form
THE system SHALL hash the password using Supabase Auth before storage

**REQ-AUTH-003**: User Login
WHEN a user enters valid credentials at /login
THE system SHALL authenticate via Supabase Auth and redirect to /dashboard

**REQ-AUTH-004**: Session Management
WHILE a user is authenticated
THE system SHALL maintain session using Supabase Auth tokens with automatic refresh

**REQ-AUTH-005**: Protected Routes
WHEN an unauthenticated user attempts to access protected routes
THE system SHALL redirect to /login

### 2. Dashboard

**REQ-DASH-001**: Dashboard Display
WHEN a user successfully logs in
THE system SHALL display a dashboard at /dashboard containing:
- Application description (max 200 characters)
- Total number of owned lists
- Total number of shared lists
- Total number of todo items across all accessible lists
- Percentage of completed items
- Grid/list view of all accessible todo lists

**REQ-DASH-002**: Progress Calculation
THE system SHALL calculate completion percentage as:
`(completed_items / total_items) * 100`
WHERE total_items > 0, else display "No items yet"

**REQ-DASH-003**: List Cards
WHEN displaying todo lists on dashboard
THE system SHALL show for each list:
- List title
- List description (truncated to 100 chars)
- Item count (completed/total)
- Owner indicator (owned vs shared)
- Last updated timestamp

**REQ-DASH-004**: List Navigation
WHEN a user clicks on a todo list card
THE system SHALL navigate to /lists/[list_id]

### 3. Todo List Management

**REQ-LIST-001**: Create List
WHEN a user clicks "Create List" button on dashboard
THE system SHALL display a form modal with:
- Title field (required, max 100 characters)
- Description field (optional, max 500 characters)
- Cancel and Create buttons

**REQ-LIST-002**: List Validation
THE system SHALL validate list creation using Zod schema:
```typescript
{
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional()
}
```

**REQ-LIST-003**: List Persistence
WHEN a user submits a valid list form
THE system SHALL:
- Insert record into todo_list table
- Set owner_user_id to current user's ID
- Set created_at and updated_at timestamps
- Redirect to the new list detail page

**REQ-LIST-004**: List Detail View
WHEN a user navigates to /lists/[id]
THE system SHALL display:
- List title and description
- "Add Item" button
- All todo items in the list
- Share button (if user is owner)
- Back to dashboard link

**REQ-LIST-005**: List Authorization
WHERE a user attempts to view a list
THE system SHALL verify via RLS policies that user is:
- List owner (owner_user_id matches), OR
- List member (exists in list_membership table)


### 4. Todo Item Management

**REQ-ITEM-001**: Create Item
WHEN a user clicks "Add Item" on list detail page
THE system SHALL display a form with:
- Title field (required, max 200 characters)
- Description field (optional, max 1000 characters)
- Default status of 'pending'

**REQ-ITEM-002**: Item Validation
THE system SHALL validate item creation using Zod schema:
```typescript
{
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  list_id: z.string().uuid()
}
```

**REQ-ITEM-003**: Item Persistence
WHEN a user submits a valid item form
THE system SHALL:
- Insert record into todo_item table
- Set list_id to current list
- Set status to 'pending'
- Set created_by_user_id and updated_by_user_id to current user
- Set created_at and updated_at timestamps

**REQ-ITEM-004**: Item Display
WHEN displaying todo items
THE system SHALL show:
- Checkbox indicating completion status
- Item title
- Truncated description (first 50 chars)
- Click handler to open edit modal

**REQ-ITEM-005**: Edit Item Modal
WHEN a user clicks on a todo item
THE system SHALL display a modal dialog with:
- Editable title field
- Editable description field
- "Mark Complete" / "Mark Incomplete" toggle button
- "Delete Item" button
- "Save" and "Cancel" buttons

**REQ-ITEM-006**: Update Item Status
WHEN a user marks an item as complete
THE system SHALL:
- Update status to 'completed'
- Set completed_at to current timestamp
- Update updated_by_user_id to current user
- Trigger updated_at timestamp update

WHEN a user marks an item as incomplete
THE system SHALL:
- Update status to 'pending'
- Set completed_at to NULL
- Update updated_by_user_id to current user

**REQ-ITEM-007**: Delete Item
WHEN a user clicks "Delete Item" in modal
THE system SHALL:
- Show confirmation dialog
- Delete record from todo_item table (if confirmed)
- Close modal and refresh list view

**REQ-ITEM-008**: Item Authorization
WHERE a user attempts to create/update/delete an item
THE system SHALL verify via RLS policies that user has:
- Owner role (list owner), OR
- Editor role (list_membership.role = 'editor')

### 5. List Sharing & Invitations

**REQ-SHARE-001**: Share List Button
WHEN a user is viewing a list they own
THE system SHALL display a "Share List" button

**REQ-SHARE-002**: Share Form
WHEN a user clicks "Share List"
THE system SHALL display a form with:
- Email input field (required, valid email format)
- Role selector (viewer/editor)
- "Send Invitation" button

**REQ-SHARE-003**: Invitation Validation
THE system SHALL validate invitation using Zod schema:
```typescript
{
  invited_email: z.string().email(),
  role: z.enum(['viewer', 'editor']),
  list_id: z.string().uuid()
}
```

**REQ-SHARE-004**: Create Invitation
WHEN a user submits valid invitation form
THE system SHALL:
- Insert record into invitation table
- Set invited_by_user_id to current user
- Set status to 'pending'

**REQ-SHARE-005**: View Invitations
WHEN a user logs in
THE system SHALL check for pending invitations matching user's email
AND display notification badge on dashboard

**REQ-SHARE-006**: Accept Invitation
WHEN a user accepts an invitation
THE system SHALL:
- Update invitation.status to 'accepted'
- Set invitation.accepted_at to current timestamp
- Insert record into list_membership table with specified role
- Redirect to the shared list

**REQ-SHARE-007**: Decline Invitation
WHEN a user declines an invitation
THE system SHALL:
- Update invitation.status to 'declined'
- Remove invitation from user's pending list

**REQ-SHARE-008**: Shared List Indicator
WHEN displaying lists on dashboard
THE system SHALL visually distinguish:
- Owned lists (show "Owner" badge)
- Shared lists (show "Shared" badge with role)


### 6. User Interface & Design

**REQ-UI-001**: Design
THE system SHALL be fully functional and optimized for:
- Desktop: 1920x1080 and above

**REQ-UI-002**: Design System
THE system SHALL implement consistent design using:
- Primary color: Blue (#3B82F6)
- Secondary color: Gray (#6B7280)
- Success color: Green (#10B981)
- Error color: Red (#EF4444)
- Typography: Inter font family
- Spacing: 4px base unit (Tailwind spacing scale)

**REQ-UI-003**: Component Library
THE system SHALL use shadcn/ui components for:
- Button
- Input
- Card
- Dialog (Modal)
- Badge
- Checkbox
- Form
- Toast (notifications)

**REQ-UI-004**: Loading States
WHEN performing async operations
THE system SHALL display:
- Skeleton loaders for initial page loads
- Spinner indicators for button actions
- Optimistic UI updates where appropriate

**REQ-UI-005**: Error Display
WHEN validation or server errors occur
THE system SHALL display:
- Inline field errors below form inputs
- Toast notifications for global errors
- Error messages in plain language

### 7. Data Layer & API

**REQ-DATA-001**: Supabase Client Configuration
THE system SHALL configure Supabase client with:
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Client-side client for all operations

**REQ-DATA-002**: Type Safety
THE system SHALL generate TypeScript types from Supabase schema:
```typescript
// types/database.ts
export type Database = {
  public: {
    Tables: {
      app_user: { Row: {...}, Insert: {...}, Update: {...} }
      todo_list: { Row: {...}, Insert: {...}, Update: {...} }
      todo_item: { Row: {...}, Insert: {...}, Update: {...} }
      list_membership: { Row: {...}, Insert: {...}, Update: {...} }
      invitation: { Row: {...}, Insert: {...}, Update: {...} }
    }
    Enums: {
      list_role: 'owner' | 'editor' | 'viewer'
      invitation_status: 'pending' | 'accepted' | 'declined'
      todo_item_status: 'pending' | 'completed'
    }
  }
}
```

**REQ-DATA-003**: Row Level Security
THE system SHALL rely on Supabase RLS policies defined in schema for:
- User data isolation
- List access control (owner + members)
- Item access control (based on list access)
- Invitation visibility


### 8. Error Handling & Validation

**REQ-ERROR-001**: Form Validation
WHEN a user submits a form
THE system SHALL validate using Zod schemas and display:
- Field-level errors inline below inputs
- Prevent submission until all errors resolved

**REQ-ERROR-002**: Authentication Errors
WHEN authentication fails
THE system SHALL:
- Display specific error message ("Invalid credentials", "Email already exists")
- Clear password field
- Maintain email field value

**REQ-ERROR-003**: Authorization Errors
WHEN a user attempts unauthorized action
THE system SHALL:
- Return 403 Forbidden status
- Display "You don't have permission to perform this action"
- Redirect to dashboard

### 9. Security Requirements

**REQ-SEC-001**: Authentication Security
THE system SHALL implement:
- Supabase Auth for password hashing (bcrypt)
- Secure session token storage (httpOnly cookies)

**REQ-SEC-002**: SQL Injection Prevention
THE system SHALL prevent SQL injection by:
- Using Supabase client parameterized queries
- Never concatenating user input into SQL strings

**REQ-SEC-003**: Environment Variables
THE system SHALL store sensitive data in environment variables:
- NEXT_PUBLIC_SUPABASE_URL (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (public, RLS-protected)

**REQ-SEC-004**: Input Sanitization
THE system SHALL sanitize all user inputs:
- Trim whitespace
- Validate against Zod schemas
- Reject inputs exceeding max length

