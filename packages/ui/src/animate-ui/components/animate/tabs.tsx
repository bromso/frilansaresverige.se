'use client'

import { cn } from '../../../lib/utils'
import {
  TabsContent as TabsContentPrimitive,
  type TabsContentProps as TabsContentPrimitiveProps,
  TabsContents as TabsContentsPrimitive,
  type TabsContentsProps as TabsContentsPrimitiveProps,
  TabsHighlightItem as TabsHighlightItemPrimitive,
  TabsHighlight as TabsHighlightPrimitive,
  TabsList as TabsListPrimitive,
  type TabsListProps as TabsListPrimitiveProps,
  Tabs as TabsPrimitive,
  type TabsProps as TabsPrimitiveProps,
  TabsTrigger as TabsTriggerPrimitive,
  type TabsTriggerProps as TabsTriggerPrimitiveProps,
} from '../../primitives/animate/tabs'

// Animate UI's animated tabs (animate-ui.com): a springing pill slides
// between triggers and the contents slide sideways while the container
// animates to the active pane's height. Changes from upstream: the
// shadcn muted/background classes are swapped for this repo's brand
// tokens, sized for the cream form cards where the tabs act as a
// stepper.

type TabsProps = TabsPrimitiveProps

function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

type TabsListProps = TabsListPrimitiveProps

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsHighlightPrimitive className="absolute inset-0 z-0 rounded-full bg-brand-blue shadow-sm">
      <TabsListPrimitive
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-1 rounded-full bg-brand-blue/5 p-1',
          className,
        )}
        {...props}
      />
    </TabsHighlightPrimitive>
  )
}

type TabsTriggerProps = TabsTriggerPrimitiveProps

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsHighlightItemPrimitive value={props.value} className="h-full flex-1">
      <TabsTriggerPrimitive
        className={cn(
          'inline-flex h-full w-full flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium whitespace-nowrap text-brand-blue/70 transition-colors duration-300 ease-in-out data-[state=active]:text-brand-cream focus:shadow-[0_0_0_0.1em_var(--color-brand-cream),0_0_0_0.2em_var(--color-brand-blue)] focus:outline-none disabled:pointer-events-none disabled:opacity-40',
          className,
        )}
        {...props}
      />
    </TabsHighlightItemPrimitive>
  )
}

type TabsContentsProps = TabsContentsPrimitiveProps

function TabsContents({ className, ...props }: TabsContentsProps) {
  // The container clips the pane slide with overflow: hidden, and the
  // primitive's inner px-2/-mx-2 gutters cancel out — pane content sits
  // exactly on the clip boundary, shearing off focus rings on fields
  // that span the pane's full width. Padding inside the clip (with a
  // negative margin so the layout footprint is unchanged) gives rings
  // 8px of visible room; the primitive's height measurement already
  // compensates for container padding.
  return (
    <TabsContentsPrimitive className={cn('-m-2 p-2', className)} {...props} />
  )
}

type TabsContentProps = TabsContentPrimitiveProps

function TabsContent({ className, style, ...props }: TabsContentProps) {
  return (
    <TabsContentPrimitive
      className={cn('outline-none', className)}
      // The primitive sets overflow: hidden on each pane, which shears
      // off focus rings on fields that span the pane's full width. The
      // TabsContents container already clips the slide animation (and
      // leaves an 8px gutter per pane), so panes can overflow freely.
      style={{ overflow: 'visible', ...style }}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsContent,
  type TabsContentProps,
  TabsContents,
  type TabsContentsProps,
  TabsList,
  type TabsListProps,
  TabsTrigger,
  type TabsTriggerProps,
}
