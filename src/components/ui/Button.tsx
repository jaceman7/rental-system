import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg': variant === 'destructive',
            'bg-success text-success-foreground hover:bg-success/90 shadow-md hover:shadow-lg': variant === 'success',
            'bg-warning text-warning-foreground hover:bg-warning/90 shadow-md hover:shadow-lg': variant === 'warning',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-md': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-8 px-3 text-xs': size === 'xs',
            'h-9 px-3': size === 'sm',
            'h-10 px-4 py-2': size === 'default',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }