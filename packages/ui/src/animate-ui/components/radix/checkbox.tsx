'use client'

import { cn } from '../../../lib/utils'
import {
  CheckboxIndicator as CheckboxIndicatorPrimitive,
  Checkbox as CheckboxPrimitive,
  type CheckboxProps as CheckboxPrimitiveProps,
} from '../../primitives/radix/checkbox'

// Animate UI's Radix checkbox (animate-ui.com): scales on hover/press and
// draws the check mark in. Changes from upstream: the cva variant/size
// system is dropped, and the classes are the ones this repo's forms were
// already styled against (carried over from the previous plain shadcn
// checkbox) so the swap only adds motion.

type CheckboxProps = CheckboxPrimitiveProps

function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive
      className={cn(
        'peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-colors duration-300 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
        className,
      )}
      {...props}
    >
      {children}
      <CheckboxIndicatorPrimitive className="size-3.5" />
    </CheckboxPrimitive>
  )
}

export { Checkbox, type CheckboxProps }
