'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from '../../primitives/buttons/button'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[box-shadow,_color,_background-color,_border-color,_outline-color,_text-decoration-color,_fill,_stroke] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        primary:
          'bg-brand-coral text-brand-grey hover:bg-brand-coral-light rounded-[3em] px-6 py-3 text-[1.1em] font-bold gap-2 max-w-max transition-[box-shadow,background] duration-150 focus:shadow-[0_0_0_0.1em_var(--color-brand-cream),0_0_0_0.2em_var(--color-brand-coral)] focus:outline-none focus-visible:ring-0',
        'primary-outline':
          'border-2 border-brand-cream/40 bg-transparent text-brand-cream hover:border-brand-cream hover:bg-brand-cream hover:text-brand-blue rounded-[3em] px-6 py-3 text-[1.1em] font-bold gap-2 max-w-max transition-[box-shadow,background,border-color,color] duration-150 focus:shadow-[0_0_0_0.1em_var(--color-brand-blue),0_0_0_0.2em_var(--color-brand-cream)] focus:outline-none focus-visible:ring-0',
        accent: 'bg-accent text-accent-foreground shadow-xs hover:bg-accent/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-10 rounded-md',
        // No dimensions of its own: for variants (like `primary`) that fully
        // own their own height/padding and must not have the default size's
        // h-9/px-4/py-2/has-[>svg]:px-3 merged in over them.
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonPrimitiveProps & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, type ButtonProps, buttonVariants }
