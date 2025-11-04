import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
            'bg-success text-success-foreground hover:bg-success/80': variant === 'success',
            'bg-warning text-warning-foreground hover:bg-warning/80': variant === 'warning',
            'text-foreground border border-input bg-background hover:bg-accent': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }