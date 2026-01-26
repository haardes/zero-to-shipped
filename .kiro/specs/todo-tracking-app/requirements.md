# Requirements Document: Todo Tracking Application

## Introduction

This document specifies the requirements for a collaborative todo tracking application. The system enables users to create, manage, and share todo lists with role-based access control. Users can register accounts, authenticate, create multiple todo lists, add items to lists, mark items as complete, and invite other users to collaborate on their lists with different permission levels.

## Glossary

- **System**: The Todo Tracking Application (web application)
- **User**: A registered person with an account in the system
- **Todo_List**: A collection of todo items with a title, description, and owner
- **Todo_Item**: An individual task within a list with title, description, and completion status
- **Owner**: The user who created a todo list (has full permissions)
- **Member**: A user who has been granted access to a list (editor or viewer role)
- **Editor**: A member role that can create, edit, and complete items
- **Viewer**: A member role that can only view items
- **Invitation**: A request to grant a user access to a todo list
- **Session**: An authenticated user's active connection to the system
- **Dashboard**: The main view showing all accessible lists and statistics
- **RLS**: Row Level Security policies enforced by the database

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to register for an account, so that I can create and manage my todo lists.

#### Acceptance Criteria

1. WHEN a user navigates to /register, THE System SHALL display a registration form with email and password fields
2. WHEN a user submits the registration form with a password less than 8 characters, THE System SHALL reject the registration and display an error message
3. WHEN a user submits the registration form with a password missing uppercase letters, THE System SHALL reject the registration and display an error message
4. WHEN a user submits the registration form with a password missing lowercase letters, THE System SHALL reject the registration and display an error message
5. WHEN a user submits the registration form with a password missing numbers, THE System SHALL reject the registration and display an error message
6. WHEN a user submits the registration form with valid credentials, THE System SHALL create a new user account and redirect to the login page
7. WHEN a user submits the registration form with an email that already exists, THE System SHALL reject the registration and display "Email already exists" error message

### Requirement 2: User Authentication

**User Story:** As a registered user, I want to log in to my account, so that I can access my todo lists.

#### Acceptance Criteria

1. WHEN a user navigates to /login, THE System SHALL display a login form with email and password fields
2. WHEN a user submits valid credentials, THE System SHALL authenticate the user and redirect to /dashboard
3. WHEN a user submits invalid credentials, THE System SHALL display "Invalid credentials" error message and clear the password field
4. WHILE a user is authenticated, THE System SHALL maintain the session using secure tokens with automatic refresh
5. WHEN an authenticated user closes the browser and returns, THE System SHALL restore the session without requiring re-login

### Requirement 3: Protected Routes

**User Story:** As the system, I want to protect authenticated routes, so that only logged-in users can access their data.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access /dashboard, THE System SHALL redirect to /login
2. WHEN an unauthenticated user attempts to access /lists/[id], THE System SHALL redirect to /login
3. WHEN an authenticated user accesses protected routes, THE System SHALL allow access and display the requested page

### Requirement 4: Dashboard Display

**User Story:** As a user, I want to see an overview of my todo lists, so that I can quickly understand my progress and navigate to specific lists.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE System SHALL redirect to /dashboard
2. WHEN the dashboard loads, THE System SHALL display the total number of lists owned by the user
3. WHEN the dashboard loads, THE System SHALL display the total number of lists shared with the user
4. WHEN the dashboard loads, THE System SHALL display the total number of todo items across all accessible lists
5. WHEN the dashboard loads, THE System SHALL display the percentage of completed items calculated as (completed_items / total_items) * 100
6. WHEN the total number of items is zero, THE System SHALL display "No items yet" instead of a percentage
7. WHEN the dashboard loads, THE System SHALL display all accessible todo lists in a grid view

### Requirement 5: List Cards Display

**User Story:** As a user, I want to see summary information for each list, so that I can quickly identify and navigate to the list I need.

#### Acceptance Criteria

1. WHEN displaying a todo list card, THE System SHALL show the list title
2. WHEN displaying a todo list card, THE System SHALL show the list description truncated to 100 characters
3. WHEN displaying a todo list card, THE System SHALL show the item count in format "X completed / Y total"
4. WHEN displaying a todo list card for an owned list, THE System SHALL show an "Owner" badge
5. WHEN displaying a todo list card for a shared list, THE System SHALL show a "Shared" badge with the user's role
6. WHEN displaying a todo list card, THE System SHALL show the last updated timestamp
7. WHEN a user clicks on a todo list card, THE System SHALL navigate to /lists/[list_id]

### Requirement 6: Create Todo List

**User Story:** As a user, I want to create new todo lists, so that I can organize different categories of tasks.

#### Acceptance Criteria

1. WHEN a user clicks the "Create List" button on the dashboard, THE System SHALL display a form modal
2. WHEN the create list modal opens, THE System SHALL display a title field marked as required with maximum 100 characters
3. WHEN the create list modal opens, THE System SHALL display a description field marked as optional with maximum 500 characters
4. WHEN the create list modal opens, THE System SHALL display Cancel and Create buttons
5. WHEN a user submits the form with an empty title, THE System SHALL display a validation error and prevent submission
6. WHEN a user submits the form with a title exceeding 100 characters, THE System SHALL display a validation error and prevent submission
7. WHEN a user submits the form with a description exceeding 500 characters, THE System SHALL display a validation error and prevent submission
8. WHEN a user submits a valid list form, THE System SHALL create a new todo list record with the current user as owner
9. WHEN a user submits a valid list form, THE System SHALL set created_at and updated_at timestamps to the current time
10. WHEN a list is successfully created, THE System SHALL redirect to the new list detail page at /lists/[id]

### Requirement 7: List Detail View

**User Story:** As a user, I want to view the details of a specific list, so that I can see and manage all items in that list.

#### Acceptance Criteria

1. WHEN a user navigates to /lists/[id], THE System SHALL display the list title
2. WHEN a user navigates to /lists/[id], THE System SHALL display the list description
3. WHEN a user navigates to /lists/[id], THE System SHALL display an "Add Item" button
4. WHEN a user navigates to /lists/[id], THE System SHALL display all todo items in the list
5. WHEN a user is the list owner, THE System SHALL display a "Share List" button
6. WHEN a user is not the list owner, THE System SHALL hide the "Share List" button
7. WHEN a user navigates to /lists/[id], THE System SHALL display a "Back to Dashboard" link

### Requirement 8: List Access Authorization

**User Story:** As the system, I want to enforce access control on lists, so that users can only view lists they own or have been granted access to.

#### Acceptance Criteria

1. WHEN a user attempts to view a list they own, THE System SHALL allow access
2. WHEN a user attempts to view a list they are a member of, THE System SHALL allow access
3. WHEN a user attempts to view a list they do not own and are not a member of, THE System SHALL return a 403 Forbidden error
4. WHEN a user receives a 403 error, THE System SHALL display "You don't have permission to perform this action" and redirect to dashboard

### Requirement 9: Create Todo Item

**User Story:** As a user with edit permissions, I want to add items to a list, so that I can track individual tasks.

#### Acceptance Criteria

1. WHEN a user clicks "Add Item" on a list detail page, THE System SHALL display a form modal
2. WHEN the add item modal opens, THE System SHALL display a title field marked as required with maximum 200 characters
3. WHEN the add item modal opens, THE System SHALL display a description field marked as optional with maximum 1000 characters
4. WHEN a user submits the form with an empty title, THE System SHALL display a validation error and prevent submission
5. WHEN a user submits the form with a title exceeding 200 characters, THE System SHALL display a validation error and prevent submission
6. WHEN a user submits the form with a description exceeding 1000 characters, THE System SHALL display a validation error and prevent submission
7. WHEN a user submits a valid item form, THE System SHALL create a new todo item with status 'pending'
8. WHEN a user submits a valid item form, THE System SHALL set created_by_user_id and updated_by_user_id to the current user
9. WHEN a user submits a valid item form, THE System SHALL set created_at and updated_at timestamps to the current time
10. WHEN an item is successfully created, THE System SHALL close the modal and refresh the list view

### Requirement 10: Display Todo Items

**User Story:** As a user, I want to see all items in a list with their status, so that I can track what needs to be done.

#### Acceptance Criteria

1. WHEN displaying a todo item, THE System SHALL show a checkbox indicating completion status
2. WHEN displaying a todo item with status 'pending', THE System SHALL show an unchecked checkbox
3. WHEN displaying a todo item with status 'completed', THE System SHALL show a checked checkbox
4. WHEN displaying a todo item, THE System SHALL show the item title
5. WHEN displaying a todo item, THE System SHALL show the description truncated to the first 50 characters
6. WHEN a user clicks on a todo item, THE System SHALL open an edit modal dialog

### Requirement 11: Edit Todo Item

**User Story:** As a user with edit permissions, I want to modify item details, so that I can update task information as needed.

#### Acceptance Criteria

1. WHEN a user clicks on a todo item, THE System SHALL display an edit modal with the current title and description
2. WHEN the edit modal opens, THE System SHALL display an editable title field
3. WHEN the edit modal opens, THE System SHALL display an editable description field
4. WHEN the edit modal opens for a pending item, THE System SHALL display a "Mark Complete" button
5. WHEN the edit modal opens for a completed item, THE System SHALL display a "Mark Incomplete" button
6. WHEN the edit modal opens, THE System SHALL display a "Delete Item" button
7. WHEN the edit modal opens, THE System SHALL display "Save" and "Cancel" buttons
8. WHEN a user clicks "Save" with valid changes, THE System SHALL update the item and set updated_by_user_id to the current user
9. WHEN a user clicks "Save" with valid changes, THE System SHALL update the updated_at timestamp
10. WHEN a user clicks "Cancel", THE System SHALL close the modal without saving changes

### Requirement 12: Update Item Completion Status

**User Story:** As a user with edit permissions, I want to mark items as complete or incomplete, so that I can track my progress.

#### Acceptance Criteria

1. WHEN a user marks an item as complete, THE System SHALL update the status to 'completed'
2. WHEN a user marks an item as complete, THE System SHALL set completed_at to the current timestamp
3. WHEN a user marks an item as complete, THE System SHALL set updated_by_user_id to the current user
4. WHEN a user marks an item as incomplete, THE System SHALL update the status to 'pending'
5. WHEN a user marks an item as incomplete, THE System SHALL set completed_at to NULL
6. WHEN a user marks an item as incomplete, THE System SHALL set updated_by_user_id to the current user

### Requirement 13: Delete Todo Item

**User Story:** As a user with edit permissions, I want to delete items, so that I can remove tasks that are no longer relevant.

#### Acceptance Criteria

1. WHEN a user clicks "Delete Item" in the edit modal, THE System SHALL display a confirmation dialog
2. WHEN a user confirms deletion, THE System SHALL remove the item record from the database
3. WHEN a user confirms deletion, THE System SHALL close the modal and refresh the list view
4. WHEN a user cancels deletion, THE System SHALL close the confirmation dialog and return to the edit modal

### Requirement 14: Item Access Authorization

**User Story:** As the system, I want to enforce edit permissions on items, so that only authorized users can modify or delete items.

#### Acceptance Criteria

1. WHEN a user with owner role attempts to create an item, THE System SHALL allow the operation
2. WHEN a user with editor role attempts to create an item, THE System SHALL allow the operation
3. WHEN a user with viewer role attempts to create an item, THE System SHALL return a 403 Forbidden error
4. WHEN a user with owner role attempts to edit an item, THE System SHALL allow the operation
5. WHEN a user with editor role attempts to edit an item, THE System SHALL allow the operation
6. WHEN a user with viewer role attempts to edit an item, THE System SHALL return a 403 Forbidden error
7. WHEN a user with owner role attempts to delete an item, THE System SHALL allow the operation
8. WHEN a user with editor role attempts to delete an item, THE System SHALL allow the operation
9. WHEN a user with viewer role attempts to delete an item, THE System SHALL return a 403 Forbidden error

### Requirement 15: Share Todo List

**User Story:** As a list owner, I want to invite other users to collaborate on my list, so that we can work together on shared tasks.

#### Acceptance Criteria

1. WHEN a user is viewing a list they own, THE System SHALL display a "Share List" button
2. WHEN a user clicks "Share List", THE System SHALL display a form modal
3. WHEN the share form opens, THE System SHALL display an email input field marked as required
4. WHEN the share form opens, THE System SHALL display a role selector with options "viewer" and "editor"
5. WHEN the share form opens, THE System SHALL display a "Send Invitation" button
6. WHEN a user submits the form with an invalid email format, THE System SHALL display a validation error and prevent submission
7. WHEN a user submits a valid invitation form, THE System SHALL create a new invitation record with status 'pending'
8. WHEN a user submits a valid invitation form, THE System SHALL set invited_by_user_id to the current user
9. WHEN an invitation is successfully created, THE System SHALL close the modal and display a success message

### Requirement 16: View Pending Invitations

**User Story:** As a user, I want to see invitations to collaborate on lists, so that I can decide whether to accept or decline them.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL query for pending invitations matching the user's email
2. WHEN pending invitations exist, THE System SHALL display a notification badge on the dashboard
3. WHEN a user clicks the notification badge, THE System SHALL display a list of pending invitations
4. WHEN displaying an invitation, THE System SHALL show the list title
5. WHEN displaying an invitation, THE System SHALL show the inviter's email
6. WHEN displaying an invitation, THE System SHALL show the proposed role
7. WHEN displaying an invitation, THE System SHALL show "Accept" and "Decline" buttons

### Requirement 17: Accept Invitation

**User Story:** As a user, I want to accept invitations to collaborate on lists, so that I can access shared lists.

#### Acceptance Criteria

1. WHEN a user clicks "Accept" on an invitation, THE System SHALL update the invitation status to 'accepted'
2. WHEN a user accepts an invitation, THE System SHALL set accepted_at to the current timestamp
3. WHEN a user accepts an invitation, THE System SHALL create a list_membership record with the specified role
4. WHEN a user accepts an invitation, THE System SHALL redirect to the shared list at /lists/[id]
5. WHEN a user accepts an invitation, THE System SHALL remove the invitation from the pending list

### Requirement 18: Decline Invitation

**User Story:** As a user, I want to decline invitations I'm not interested in, so that I can keep my invitation list clean.

#### Acceptance Criteria

1. WHEN a user clicks "Decline" on an invitation, THE System SHALL update the invitation status to 'declined'
2. WHEN a user declines an invitation, THE System SHALL remove the invitation from the pending list
3. WHEN a user declines an invitation, THE System SHALL not create a list_membership record

### Requirement 19: Responsive Design

**User Story:** As a user, I want the application to work well on desktop, so that I can use it comfortably on my preferred device.

#### Acceptance Criteria

1. THE System SHALL display correctly on desktop screens with resolution 1920x1080 and above
2. THE System SHALL use a consistent design system with primary color Blue (#3B82F6)
3. THE System SHALL use Inter font family for all text
4. THE System SHALL use Tailwind spacing scale with 4px base unit

### Requirement 20: Component Library

**User Story:** As a developer, I want to use a consistent component library, so that the UI is cohesive and maintainable.

#### Acceptance Criteria

1. THE System SHALL use shadcn/ui Button component for all buttons
2. THE System SHALL use shadcn/ui Input component for all text inputs
3. THE System SHALL use shadcn/ui Card component for list cards
4. THE System SHALL use shadcn/ui Dialog component for all modals
5. THE System SHALL use shadcn/ui Badge component for role and status indicators
6. THE System SHALL use shadcn/ui Checkbox component for item completion status
7. THE System SHALL use shadcn/ui Form component for all forms
8. THE System SHALL use shadcn/ui Toast component for notifications

### Requirement 21: Loading States

**User Story:** As a user, I want to see loading indicators during operations, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a page is initially loading, THE System SHALL display skeleton loaders
2. WHEN a button action is in progress, THE System SHALL display a spinner indicator on the button
3. WHEN a button action is in progress, THE System SHALL disable the button to prevent duplicate submissions
4. WHEN data is being updated, THE System SHALL apply optimistic UI updates where appropriate

### Requirement 22: Error Display

**User Story:** As a user, I want to see clear error messages, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a form validation error occurs, THE System SHALL display the error message inline below the relevant input field
2. WHEN a server error occurs, THE System SHALL display a toast notification with the error message
3. WHEN an authorization error occurs, THE System SHALL display "You don't have permission to perform this action"
4. THE System SHALL display all error messages in plain, user-friendly language

### Requirement 23: Data Layer Configuration

**User Story:** As a developer, I want to configure the Supabase client correctly, so that the application can communicate with the database.

#### Acceptance Criteria

1. THE System SHALL configure the Supabase client using NEXT_PUBLIC_SUPABASE_URL environment variable
2. THE System SHALL configure the Supabase client using NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable
3. THE System SHALL use the client-side Supabase client for all database operations
4. THE System SHALL initialize the Supabase client once and reuse it across the application

### Requirement 24: Type Safety

**User Story:** As a developer, I want TypeScript types for all database entities, so that I can catch type errors at compile time.

#### Acceptance Criteria

1. THE System SHALL generate TypeScript types from the Supabase database schema
2. THE System SHALL define types for app_user table with Row, Insert, and Update interfaces
3. THE System SHALL define types for todo_list table with Row, Insert, and Update interfaces
4. THE System SHALL define types for todo_item table with Row, Insert, and Update interfaces
5. THE System SHALL define types for list_membership table with Row, Insert, and Update interfaces
6. THE System SHALL define types for invitation table with Row, Insert, and Update interfaces
7. THE System SHALL define enum types for list_role ('owner', 'editor', 'viewer')
8. THE System SHALL define enum types for invitation_status ('pending', 'accepted', 'declined')
9. THE System SHALL define enum types for todo_item_status ('pending', 'completed')

### Requirement 25: Row Level Security

**User Story:** As the system, I want to enforce data access policies at the database level, so that users can only access data they're authorized to see.

#### Acceptance Criteria

1. THE System SHALL rely on Supabase RLS policies for user data isolation
2. THE System SHALL rely on Supabase RLS policies for list access control based on ownership and membership
3. THE System SHALL rely on Supabase RLS policies for item access control based on list access
4. THE System SHALL rely on Supabase RLS policies for invitation visibility based on email matching

### Requirement 26: Form Validation

**User Story:** As a user, I want immediate feedback on form errors, so that I can correct them before submission.

#### Acceptance Criteria

1. WHEN a user submits a form, THE System SHALL validate all fields using Zod schemas
2. WHEN validation errors exist, THE System SHALL display field-level errors inline below the relevant inputs
3. WHEN validation errors exist, THE System SHALL prevent form submission
4. WHEN a user corrects a validation error, THE System SHALL remove the error message immediately

### Requirement 27: Authentication Error Handling

**User Story:** As a user, I want specific error messages for authentication failures, so that I know what went wrong.

#### Acceptance Criteria

1. WHEN authentication fails due to invalid credentials, THE System SHALL display "Invalid credentials"
2. WHEN registration fails due to existing email, THE System SHALL display "Email already exists"
3. WHEN an authentication error occurs, THE System SHALL clear the password field
4. WHEN an authentication error occurs, THE System SHALL maintain the email field value

### Requirement 28: Security Implementation

**User Story:** As the system, I want to implement security best practices, so that user data is protected.

#### Acceptance Criteria

1. THE System SHALL use Supabase Auth for password hashing with bcrypt algorithm
2. THE System SHALL store session tokens in httpOnly cookies
3. THE System SHALL use parameterized queries through the Supabase client for all database operations
4. THE System SHALL store the Supabase URL in the NEXT_PUBLIC_SUPABASE_URL environment variable
5. THE System SHALL store the Supabase anonymous key in the NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable
6. THE System SHALL trim whitespace from all user inputs before processing
7. THE System SHALL validate all user inputs against Zod schemas before processing
8. THE System SHALL reject inputs exceeding maximum length constraints
