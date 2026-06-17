// FormField composing shadcn Label + Input.
// Keeps the legacy API (label, registration, error, children) for all consumers.
import type { InputHTMLAttributes, ReactNode } from 'react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { Input } from './input'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  registration?: UseFormRegisterReturn
  error?: FieldError
  children?: ReactNode
}

export function FormField({ label, registration, error, children, id, className, ...rest }: FormFieldProps) {
  const fieldId = id ?? registration?.name ?? label
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={fieldId}>{label}</Label>
      {children ?? (
        <Input
          id={fieldId}
          {...registration}
          {...rest}
          className={cn(
            error ? 'border-destructive focus-visible:ring-destructive' : '',
            className,
          )}
        />
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  )
}

