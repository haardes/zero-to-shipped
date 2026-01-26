/**
 * FieldError Component
 * 
 * Displays inline error messages for form fields. This component is used
 * for displaying errors outside of react-hook-form context, or for custom
 * error handling scenarios.
 * 
 * For react-hook-form integrated forms, use <FormMessage /> instead.
 * 
 * @module components/ui/field-error
 */

import { cn } from '@/lib/utils'

interface FieldErrorProps {
  /**
   * Error message to display. If undefined or empty, nothing is rendered.
   */
  message?: string
  
  /**
   * Additional CSS classes to apply to the error message
   */
  className?: string
}

/**
 * FieldError Component
 * 
 * Displays an inline error message below a form field. Returns null if no
 * message is provided, making it safe to always render.
 * 
 * @param props - Component props
 * @returns Error message paragraph or null
 * 
 * @example
 * // Basic usage
 * <Input type="email" value={email} onChange={handleChange} />
 * <FieldError message={emailError} />
 * 
 * @example
 * // With custom styling
 * <Input type="text" value={title} onChange={handleChange} />
 * <FieldError message={titleError} className="mt-2" />
 * 
 * @example
 * // Conditional rendering (component handles this internally)
 * <Input type="password" value={password} onChange={handleChange} />
 * <FieldError message={passwordError} />
 * 
 * @remarks
 * - Returns null if message is undefined or empty
 * - Uses destructive text color (red) by default
 * - Text size is small (text-sm)
 * - Includes top margin (mt-1) for spacing from input
 * - For react-hook-form forms, use <FormMessage /> instead
 * 
 * Requirements: 22.1, 22.4
 */
export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p className={cn('text-sm text-destructive mt-1', className)}>
      {message}
    </p>
  )
}
