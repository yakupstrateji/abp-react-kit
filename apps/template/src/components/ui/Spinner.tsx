import { cn } from '@/lib/utils'

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex items-center gap-2 p-4 text-sm text-muted-foreground', className)}
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      {label}
    </div>
  )
}
