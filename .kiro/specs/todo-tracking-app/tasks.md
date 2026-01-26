# Implementation Plan: Todo Tracking Application

## Overview

This implementation plan breaks down the Todo Tracking Application into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The plan follows a bottom-up approach: infrastructure → data layer → authentication → core features → sharing features.

## Tasks

- [x] 1. Set up project infrastructure and configuration
  - Initialize Next.js 14+ project with TypeScript and App Router
  - Configure Tailwind CSS and install shadcn/ui components
  - Set up environment variables for Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - Configure Vitest and fast-check for testing
  - Create project directory structure (app/, components/, lib/, types/, utils/)
  - _Requirements: 23.1, 23.2, 23.3, 28.4, 28.5_

- [x] 2. Implement Supabase client and type definitions
  - [x] 2.1 Create Supabase client configuration in lib/supabase/client.ts
    - Configure client with environment variables
    - Enable session persistence and auto-refresh
    - _Requirements: 23.1, 23.2, 23.3, 23.4_
  
  - [x] 2.2 Generate and define database TypeScript types in types/database.ts
    - Define Database type with all tables (app_user, todo_list, todo_item, list_membership, invitation)
    - Define Row, Insert, and Update interfaces for each table
    - Define enum types (list_role, invitation_status, todo_item_status)
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9_
  
  - [x] 2.3 Create domain types in types/todo.ts and types/user.ts
    - Define TodoList, TodoItem, ListMembership, Invitation interfaces
    - Define User interface
    - Define Result<T> type for error handling
    - _Requirements: 24.1_

- [x] 3. Implement validation schemas
  - Create Zod schemas in utils/validation.ts
  - Define registerSchema with email and password validation (8+ chars, uppercase, lowercase, number)
  - Define loginSchema with email and password validation
  - Define createListSchema (title 1-100 chars, description optional max 500 chars)
  - Define createItemSchema (title 1-200 chars, description optional max 1000 chars)
  - Define updateItemSchema for partial updates
  - Define createInvitationSchema (email, role enum)
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.5, 6.6, 6.7, 9.4, 9.5, 9.6, 15.6, 26.1, 28.6, 28.7, 28.8_

- [ ]* 4. Write unit tests for validation schemas
  - Test password validation edge cases (too short, missing uppercase, missing lowercase, missing number)
  - Test title length validation (empty, max length exceeded)
  - Test description length validation (max length exceeded)
  - Test email format validation
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.5, 6.6, 6.7, 9.4, 9.5, 9.6, 15.6_

- [x] 5. Implement authentication data access functions
  - [x] 5.1 Create authentication functions in lib/supabase/auth.ts
    - Implement registerUser(email, password): Promise<Result<User>>
    - Implement loginUser(email, password): Promise<Result<Session>>
    - Implement getSession(): Promise<Session | null>
    - Implement logoutUser(): Promise<void>
    - Apply input sanitization (trim whitespace)
    - _Requirements: 1.6, 2.2, 2.4, 28.1, 28.2, 28.6_
  
  - [ ]* 5.2 Write property test for user registration success
    - **Property 1: User Registration Success**
    - Generate random valid emails and passwords
    - Verify registration creates account and allows login
    - **Validates: Requirements 1.6**
  
  - [ ]* 5.3 Write property test for session persistence
    - **Property 2: User Authentication Session Persistence**
    - Verify authenticated sessions remain valid across requests
    - **Validates: Requirements 2.4**
  
  - [ ]* 5.4 Write unit tests for authentication error cases
    - Test invalid credentials error handling
    - Test duplicate email error handling
    - Verify password field cleared on error
    - _Requirements: 1.7, 2.3, 27.1, 27.2, 27.3, 27.4_

- [x] 6. Implement authentication UI components
  - [x] 6.1 Create RegisterForm component in components/auth/RegisterForm.tsx
    - Build form with email, password, confirmPassword fields
    - Integrate registerSchema validation
    - Handle registration submission and errors
    - Display inline validation errors
    - Redirect to /login on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 22.1, 22.4, 27.2, 27.3, 27.4_
  
  - [x] 6.2 Create LoginForm component in components/auth/LoginForm.tsx
    - Build form with email and password fields
    - Integrate loginSchema validation
    - Handle login submission and errors
    - Display inline validation errors
    - Redirect to /dashboard on success
    - _Requirements: 2.1, 2.2, 2.3, 22.1, 22.4, 27.1, 27.3, 27.4_
  
  - [x] 6.3 Create authentication pages
    - Create app/(auth)/register/page.tsx with RegisterForm
    - Create app/(auth)/login/page.tsx with LoginForm
    - _Requirements: 1.1, 2.1_

- [x] 7. Implement route protection middleware
  - Create middleware.ts for route protection
  - Check authentication status for protected routes (/dashboard, /lists/*)
  - Redirect unauthenticated users to /login
  - Allow authenticated users to proceed
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 8. Write tests for route protection
  - [ ]* 8.1 Write unit tests for specific route protection
    - Test /dashboard redirects when unauthenticated
    - Test /lists/[id] redirects when unauthenticated
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 8.2 Write property test for protected route access
    - **Property 3: Protected Route Access Control**
    - Verify authenticated users can access any protected route
    - **Validates: Requirements 3.3**

- [x] 9. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement list data access functions
  - [x] 10.1 Create list functions in lib/supabase/lists.ts
    - Implement createList(title, description?): Promise<Result<TodoList>>
    - Implement getListsForUser(userId): Promise<Result<TodoList[]>>
    - Implement getListById(listId): Promise<Result<TodoList>>
    - Implement updateList(listId, updates): Promise<Result<TodoList>>
    - Implement deleteList(listId): Promise<Result<void>>
    - Apply input sanitization (trim whitespace)
    - _Requirements: 6.8, 6.9, 7.1, 7.2, 8.1, 8.2, 28.3, 28.6_
  
  - [ ]* 10.2 Write property test for list creation and persistence
    - **Property 6: List Creation and Persistence**
    - Generate random valid list data
    - Verify created lists are persisted and accessible
    - **Validates: Requirements 6.8, 6.9, 6.10**
  
  - [ ]* 10.3 Write property test for list access authorization
    - **Property 8: List Access Authorization**
    - Generate random lists and user combinations
    - Verify owners and members can access, others get 403
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 11. Implement dashboard statistics function
  - Create getDashboardStats(userId) in lib/supabase/stats.ts
  - Query owned lists count
  - Query shared lists count (via list_membership)
  - Query total items across accessible lists
  - Query completed items count
  - Calculate completion percentage (handle zero items case)
  - Return DashboardStats object
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 12. Write property test for dashboard statistics
  - **Property 4: Dashboard Statistics Accuracy**
  - Generate random user data with lists and items
  - Verify all statistics calculated correctly
  - Verify "No items yet" case when total is 0
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

- [x] 13. Implement dashboard UI components
  - [x] 13.1 Create DashboardStats component in components/dashboard/DashboardStats.tsx
    - Fetch and display statistics using getDashboardStats
    - Display owned lists count, shared lists count, total items, completion percentage
    - Handle "No items yet" case
    - Show loading skeleton while fetching
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 21.1_
  
  - [x] 13.2 Create ListCard component in components/dashboard/ListCard.tsx
    - Display title, truncated description (100 chars), item counts
    - Display role badge (Owner or Shared with role)
    - Display last updated timestamp
    - Handle click to navigate to list detail
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 13.3 Write property test for list card display
    - **Property 5: List Card Display Completeness**
    - Generate random lists
    - Verify all required fields are displayed
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
  
  - [x] 13.4 Create ListGrid component in components/dashboard/ListGrid.tsx
    - Fetch lists using getListsForUser
    - Render ListCard for each list in grid layout
    - Show loading skeleton while fetching
    - _Requirements: 4.7, 21.1_
  
  - [x] 13.5 Create CreateListModal component in components/dashboard/CreateListModal.tsx
    - Build modal with title and description fields
    - Integrate createListSchema validation
    - Handle submission with createList function
    - Display inline validation errors
    - Show loading spinner on submit button during creation
    - Close modal and refresh on success
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 21.2, 21.3, 22.1_
  
  - [x] 13.6 Create dashboard page at app/(dashboard)/dashboard/page.tsx
    - Render DashboardStats component
    - Render "Create List" button that opens CreateListModal
    - Render ListGrid component
    - _Requirements: 4.1, 4.7, 6.1_

- [ ] 14. Checkpoint - Ensure dashboard tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement item data access functions
  - [x] 15.1 Create item functions in lib/supabase/items.ts
    - Implement createItem(listId, title, description?): Promise<Result<TodoItem>>
    - Implement getItemsForList(listId): Promise<Result<TodoItem[]>>
    - Implement updateItem(itemId, updates): Promise<Result<TodoItem>>
    - Implement toggleItemStatus(itemId): Promise<Result<TodoItem>>
    - Implement deleteItem(itemId): Promise<Result<void>>
    - Apply input sanitization (trim whitespace)
    - _Requirements: 9.7, 9.8, 9.9, 10.1, 11.8, 11.9, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.2, 28.3, 28.6_
  
  - [ ]* 15.2 Write property test for item creation and persistence
    - **Property 9: Item Creation and Persistence**
    - Generate random valid item data
    - Verify created items are persisted with correct defaults
    - **Validates: Requirements 9.7, 9.8, 9.9, 9.10**
  
  - [ ]* 15.3 Write property test for item update persistence
    - **Property 11: Item Update Persistence**
    - Generate random items and updates
    - Verify updates are persisted with correct metadata
    - **Validates: Requirements 11.8, 11.9**
  
  - [ ]* 15.4 Write property test for item status toggle
    - **Property 12: Item Status Toggle Correctness**
    - Generate random items
    - Verify toggle from pending to completed sets status and completed_at
    - Verify toggle from completed to pending sets status and clears completed_at
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**
  
  - [ ]* 15.5 Write property test for item deletion
    - **Property 13: Item Deletion**
    - Generate random items
    - Verify deleted items are removed and no longer queryable
    - **Validates: Requirements 13.2, 13.3**
  
  - [ ]* 15.6 Write property test for item authorization by role
    - **Property 14: Item Authorization by Role**
    - Generate random items and users with different roles
    - Verify owner/editor can perform operations, viewer gets 403
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9**

- [x] 16. Implement list detail UI components
  - [x] 16.1 Create ListHeader component in components/lists/ListHeader.tsx
    - Display list title and description
    - Display "Add Item" button
    - Display "Share List" button if user is owner
    - Display "Back to Dashboard" link
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_
  
  - [ ]* 16.2 Write property test for list detail view completeness
    - **Property 7: List Detail View Completeness**
    - Generate random lists
    - Verify all required elements are displayed
    - Verify "Share List" button shown only for owners
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
  
  - [x] 16.3 Create ItemCard component in components/items/ItemCard.tsx
    - Display checkbox reflecting completion status
    - Display item title
    - Display truncated description (50 chars)
    - Handle click to open edit modal
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ]* 16.4 Write property test for item display completeness
    - **Property 10: Item Display Completeness**
    - Generate random items
    - Verify checkbox, title, and truncated description displayed
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  
  - [x] 16.5 Create ItemList component in components/items/ItemList.tsx
    - Fetch items using getItemsForList
    - Render ItemCard for each item
    - Show loading skeleton while fetching
    - _Requirements: 7.4, 21.1_
  
  - [x] 16.6 Create AddItemModal component in components/items/AddItemModal.tsx
    - Build modal with title and description fields
    - Integrate createItemSchema validation
    - Handle submission with createItem function
    - Display inline validation errors
    - Show loading spinner on submit button
    - Close modal and refresh on success
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 21.2, 21.3, 22.1_
  
  - [x] 16.7 Create EditItemModal component in components/items/EditItemModal.tsx
    - Build modal with editable title and description fields
    - Display "Mark Complete" / "Mark Incomplete" button based on status
    - Display "Delete Item" button
    - Display "Save" and "Cancel" buttons
    - Integrate updateItemSchema validation
    - Handle save with updateItem function
    - Handle status toggle with toggleItemStatus function
    - Handle delete with confirmation dialog and deleteItem function
    - Display inline validation errors
    - Show loading spinner on buttons
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4, 21.2, 21.3, 22.1_
  
  - [x] 16.8 Create list detail page at app/(dashboard)/lists/[id]/page.tsx
    - Fetch list using getListById
    - Render ListHeader component
    - Render ItemList component
    - Handle AddItemModal and EditItemModal state
    - Handle authorization errors (403) with redirect to dashboard
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.4, 22.3_

- [ ] 17. Checkpoint - Ensure list and item tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement invitation data access functions
  - [x] 18.1 Create invitation functions in lib/supabase/invitations.ts
    - Implement createInvitation(listId, email, role): Promise<Result<Invitation>>
    - Implement getPendingInvitations(email): Promise<Result<Invitation[]>>
    - Implement acceptInvitation(invitationId): Promise<Result<ListMembership>>
    - Implement declineInvitation(invitationId): Promise<Result<void>>
    - Apply input sanitization (trim whitespace)
    - _Requirements: 15.7, 15.8, 16.1, 16.2, 17.1, 17.2, 17.3, 17.4, 18.1, 18.2, 28.3, 28.6_
  
  - [ ]* 18.2 Write property test for invitation creation and persistence
    - **Property 15: Invitation Creation and Persistence**
    - Generate random valid invitation data
    - Verify invitations are persisted and queryable by email
    - **Validates: Requirements 15.7, 15.8, 15.9**
  
  - [ ]* 18.3 Write property test for pending invitations visibility
    - **Property 16: Pending Invitations Visibility**
    - Generate random invitations with different statuses
    - Verify only pending invitations for matching email are returned
    - **Validates: Requirements 16.1, 16.2**
  
  - [ ]* 18.4 Write property test for invitation acceptance
    - **Property 17: Invitation Acceptance Creates Membership**
    - Generate random pending invitations
    - Verify acceptance updates status, creates membership, and grants access
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**
  
  - [ ]* 18.5 Write property test for invitation decline
    - **Property 18: Invitation Decline**
    - Generate random pending invitations
    - Verify decline updates status without creating membership
    - **Validates: Requirements 18.1, 18.2, 18.3**

- [x] 19. Implement sharing UI components
  - [x] 19.1 Create ShareListModal component in components/lists/ShareListModal.tsx
    - Build modal with email input and role selector
    - Integrate createInvitationSchema validation
    - Handle submission with createInvitation function
    - Display inline validation errors
    - Show loading spinner on submit button
    - Display success toast on invitation sent
    - Close modal on success
    - _Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.9, 21.2, 21.3, 22.1, 22.2_
  
  - [x] 19.2 Create InvitationCard component in components/dashboard/InvitationCard.tsx
    - Display list title, inviter email, proposed role
    - Display "Accept" and "Decline" buttons
    - Handle accept with acceptInvitation function
    - Handle decline with declineInvitation function
    - Show loading spinner on buttons
    - _Requirements: 16.4, 16.5, 16.6, 16.7, 21.2, 21.3_
  
  - [x] 19.3 Create InvitationList component in components/dashboard/InvitationList.tsx
    - Fetch pending invitations using getPendingInvitations
    - Render InvitationCard for each invitation
    - Display notification badge when invitations exist
    - Show loading skeleton while fetching
    - _Requirements: 16.1, 16.2, 16.3, 21.1_
  
  - [x] 19.4 Integrate InvitationList into dashboard page
    - Add InvitationList component to dashboard
    - Display notification badge for pending invitations
    - _Requirements: 16.2, 16.3_
  
  - [x] 19.5 Integrate ShareListModal into list detail page
    - Add "Share List" button to ListHeader (only for owners)
    - Handle ShareListModal state
    - _Requirements: 15.1, 15.2_

- [ ] 20. Implement form validation property test
  - [ ]* 20.1 Write property test for form validation consistency
    - **Property 19: Form Validation Consistency**
    - Generate random invalid form data for all forms
    - Verify validation prevents submission and displays errors
    - **Validates: Requirements 26.1, 26.2, 26.3, 26.4**

- [x] 21. Implement error handling and display
  - Create error handling utilities in utils/errors.ts
  - Implement showError function for toast notifications
  - Implement FieldError component for inline errors
  - Ensure all data access functions return Result<T> type
  - Ensure all components handle errors consistently
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 8.4_

- [x] 22. Implement UI polish and loading states
  - Add skeleton loaders for all async data fetching
  - Add spinner indicators to all action buttons
  - Disable buttons during async operations
  - Implement optimistic UI updates where appropriate
  - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [ ] 23. Final checkpoint - Run full test suite
  - Run all unit tests and verify 80%+ coverage
  - Run all 19 property-based tests (100 iterations each)
  - Run integration tests for critical flows
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Create landing page and final integration
  - Create app/page.tsx landing page with links to /login and /register
  - Create root layout with global styles and toast provider
  - Verify all routes are properly connected
  - Test end-to-end user flows manually
  - _Requirements: All requirements integrated_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations
- Checkpoints ensure incremental validation throughout development
- All data access functions use Result<T> pattern for consistent error handling
- All user inputs are sanitized (trimmed) before processing
- All forms use Zod schemas for validation
- All async operations show loading states
- RLS policies enforce authorization at database level
