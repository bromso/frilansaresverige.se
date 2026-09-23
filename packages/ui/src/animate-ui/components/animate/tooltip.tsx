import { m } from 'motion/react'
import type * as React from 'react'
import { LayoutMotion } from '../../../lib/layout-motion'
import { cn } from '../../../lib/utils'
import {
  TooltipArrow as TooltipArrowPrimitive,
  TooltipContent as TooltipContentPrimitive,
  type TooltipContentProps as TooltipContentPrimitiveProps,
  Tooltip as TooltipPrimitive,
  type TooltipProps as TooltipPrimitiveProps,
  TooltipProvider as TooltipProviderPrimitive,
  type TooltipProviderProps as TooltipProviderPrimitiveProps,
  TooltipTrigger as TooltipTriggerPrimitive,
  type TooltipTriggerProps as TooltipTriggerPrimitiveProps,
} from '../../primitives/animate/tooltip'

type TooltipProviderProps = TooltipProviderPrimitiveProps

function TooltipProvider({ openDelay = 0, ...props }: TooltipProviderProps) {
  // The content and arrow carry a layoutId so the tooltip glides between
  // neighbouring triggers — that needs motion's layout features.
  return (
    <LayoutMotion>
      <TooltipProviderPrimitive openDelay={openDelay} {...props} />
    </LayoutMotion>
  )
}

type TooltipProps = TooltipPrimitiveProps

function Tooltip({ sideOffset = 10, ...props }: TooltipProps) {
  return <TooltipPrimitive sideOffset={sideOffset} {...props} />
}

type TooltipTriggerProps = TooltipTriggerPrimitiveProps

function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <TooltipTriggerPrimitive {...props} />
}

type TooltipContentProps = Omit<TooltipContentPrimitiveProps, 'asChild'> & {
  children: React.ReactNode
  layout?: boolean | 'position' | 'size' | 'preserve-aspect'
}

function TooltipContent({
  className,
  children,
  layout = 'preserve-aspect',
  ...props
}: TooltipContentProps) {
  return (
    <TooltipContentPrimitive
      className={cn(
        'z-50 w-fit bg-primary text-primary-foreground rounded-md',
        className,
      )}
      {...props}
    >
      <m.div className="overflow-hidden px-3 py-1.5 text-xs text-balance">
        <m.div layout={layout}>{children}</m.div>
      </m.div>
      <TooltipArrowPrimitive
        className="fill-primary size-3 data-[side='bottom']:translate-y-[1px] data-[side='right']:translate-x-[1px] data-[side='left']:translate-x-[-1px] data-[side='top']:translate-y-[-1px]"
        tipRadius={2}
      />
    </TooltipContentPrimitive>
  )
}

export {
  Tooltip,
  TooltipContent,
  type TooltipContentProps,
  type TooltipProps,
  TooltipProvider,
  type TooltipProviderProps,
  TooltipTrigger,
  type TooltipTriggerProps,
}
