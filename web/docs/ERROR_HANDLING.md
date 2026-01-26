# Error Handling Guide

This document describes the error handling patterns and utilities used throughout the Todo Tracking Application.

## Overview

The application uses a consistent error handling strategy across all layers:

1. **Data Access Layer**: All functions return `Result<T>` type
2. **Component Layer**: Components use centralized error utilities
3. **Display Layer**: Errors are shown via toast notifications or inline field errors

## Result Type Pattern

All data access functions return a `Result<T>` type for type-safe error handling:

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### Usage Example

```typescript
const result = await createList(title, description)
if (!result.success) {
  showError(result.error)
  return
}
// Use result.data safely
console.log('Created list:', result.data.title)
```

## Error Display Utilities

### showError(message: string)

Displays an error message as a toast notification. Use for:
- Server errors
- Authentication errors
- Authorization errors
- Network errors

```typescript
import { showError } from '@/utils/errors'

// Display authentication error
showError('Invalid credentials')

// Display authorization error
showError("You don't have permission to perform this action")

// Use with Result type
const result = await createList(title, description)
if (!result.success) {
  showError(result.error)
  return
}
```

### showSuccess(message: string)

Displays a success message as a toast notification. Use for:
- Successful operations (create, update, delete)
- Confirmation messages

```typescript
import { showSuccess } from '@/utils/errors'

// Display success after creating a list
showSuccess('List created successfully!')

// Display success after accepting invitation
showSuccess('Invitation accepted!')
```

### handleResultError(result)

Helper function to handle Result type errors automatically:

```typescript
import { handleResultError } from '@/utils/errors'

const result = await loginUser(email, password)
if (handleResultError(result)) {
  return // Error was displayed, exit early
}
// Continue with result.data
router.push('/dashboard')
```

## Inline Field Errors

### FormMessage Component (react-hook-form)

For forms using react-hook-form, use the `<FormMessage />` component:

```typescript
import { FormMessage } from '@/components/ui/form'

<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Displays validation errors inline */}
    </FormItem>
  )}
/>
```

### FieldError Component (standalone)

For custom forms or non-react-hook-form scenarios:

```typescript
import { FieldError } from '@/components/ui/field-error'

<Input 
  type="email" 
  value={email} 
  onChange={handleChange} 
/>
<FieldError message={emailError} />
```

## Error Categories

### 1. Validation Errors

**When**: Client-side validation failures (Zod schema violations)
**Display**: Inline below form fields using `<FormMessage />` or `<FieldError />`
**Behavior**: Prevent form submission until resolved

```typescript
// Validation is handled automatically by react-hook-form + Zod
const form = useForm({
  resolver: zodResolver(createListSchema),
})
```

### 2. Authentication Errors

**When**: Login/registration failures
**Display**: Toast notifications
**Behavior**: Clear password field, maintain email field

```typescript
const result = await loginUser(email, password)
if (!result.success) {
  showError(result.error) // "Invalid credentials"
  form.setValue('password', '') // Clear password
  return
}
```

### 3. Authorization Errors (403)

**When**: Permission denied
**Display**: Toast notifications
**Behavior**: Redirect to dashboard

```typescript
const result = await getListById(listId)
if (!result.success) {
  if (isAuthorizationError(result.error)) {
    showError("You don't have permission to perform this action")
    router.push('/dashboard')
    return
  }
  showError(result.error)
}
```

### 4. Server Errors

**When**: Database or network failures
**Display**: Toast notifications
**Behavior**: Log to console for debugging

```typescript
try {
  const result = await createList(title, description)
  if (!result.success) {
    showError(result.error)
    return
  }
  // Success handling
} catch (error) {
  console.error('Unexpected error:', error)
  showError('An unexpected error occurred. Please try again.')
}
```

## Standard Error Messages

Use the `ErrorMessages` constants for consistent messaging:

```typescript
import { ErrorMessages } from '@/utils/errors'

// Authentication errors
ErrorMessages.INVALID_CREDENTIALS // "Invalid credentials"
ErrorMessages.EMAIL_ALREADY_EXISTS // "Email already exists"
ErrorMessages.USER_NOT_AUTHENTICATED // "User not authenticated"

// Authorization errors
ErrorMessages.PERMISSION_DENIED // "You don't have permission to perform this action"

// Generic errors
ErrorMessages.UNEXPECTED_ERROR // "An unexpected error occurred. Please try again."
ErrorMessages.NETWORK_ERROR // "Network error. Please check your connection and try again."

// Resource errors
ErrorMessages.NOT_FOUND // "Resource not found"
ErrorMessages.FAILED_TO_LOAD // "Failed to load data. Please try again."
ErrorMessages.FAILED_TO_SAVE // "Failed to save changes. Please try again."
ErrorMessages.FAILED_TO_DELETE // "Failed to delete. Please try again."
```

## Best Practices

### 1. Always Handle Result Types

```typescript
// ✅ Good
const result = await createList(title, description)
if (!result.success) {
  showError(result.error)
  return
}
// Use result.data

// ❌ Bad - doesn't handle errors
const result = await createList(title, description)
const list = result.data // TypeScript error if result.success is false
```

### 2. Use Centralized Error Functions

```typescript
// ✅ Good
import { showError } from '@/utils/errors'
showError(result.error)

// ❌ Bad - direct toast usage
import { toast } from 'sonner'
toast.error(result.error)
```

### 3. Provide User-Friendly Messages

```typescript
// ✅ Good
showError('Failed to load lists. Please try again.')

// ❌ Bad - technical error message
showError('PGRST116: relation "todo_list" does not exist')
```

### 4. Clear Sensitive Fields on Error

```typescript
// ✅ Good - clear password on authentication error
if (!result.success) {
  showError(result.error)
  form.setValue('password', '')
  return
}

// ❌ Bad - password remains visible
if (!result.success) {
  showError(result.error)
  return
}
```

### 5. Log Errors for Debugging

```typescript
// ✅ Good - log technical details, show user-friendly message
try {
  const result = await createList(title, description)
  if (!result.success) {
    console.error('Failed to create list:', result.error)
    showError('Failed to create list. Please try again.')
    return
  }
} catch (error) {
  console.error('Unexpected error:', error)
  showError('An unexpected error occurred. Please try again.')
}
```

## Component Error Handling Template

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showError, showSuccess } from '@/utils/errors'
import { mySchema } from '@/utils/validation'
import { myDataAccessFunction } from '@/lib/supabase/...'

export function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(mySchema),
    defaultValues: { /* ... */ },
  })

  async function onSubmit(data: MyFormData): Promise<void> {
    setIsLoading(true)

    try {
      const result = await myDataAccessFunction(data)

      if (!result.success) {
        showError(result.error)
        return
      }

      showSuccess('Operation successful!')
      // Handle success (redirect, close modal, etc.)
    } catch (error) {
      console.error('Unexpected error:', error)
      showError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields with FormMessage for inline errors */}
      </form>
    </Form>
  )
}
```

## Requirements Mapping

This error handling implementation satisfies the following requirements:

- **Requirement 22.1**: Form validation errors displayed inline below input fields
- **Requirement 22.2**: Server errors displayed as toast notifications
- **Requirement 22.3**: Authorization errors display "You don't have permission to perform this action"
- **Requirement 22.4**: All error messages in plain, user-friendly language
- **Requirement 8.4**: 403 errors handled with permission message and redirect to dashboard
- **Requirement 27.1**: Invalid credentials error message
- **Requirement 27.2**: Email already exists error message
- **Requirement 27.3**: Password field cleared on authentication error
- **Requirement 27.4**: Email field value maintained on authentication error
