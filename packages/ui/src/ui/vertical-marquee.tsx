'use client'

import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface VerticalMarqueeProps extends HTMLAttributes<HTMLDivElement> {
  /** Scroll upwards by default; reverse scrolls downwards. */
  reverse?: boolean
  pauseOnHover?: boolean
  /** How many copies of the children to render; must fill the visible
      height at least twice for the loop to be seamless. */
  repeat?: number
  /** Pause the scroll (e.g. while the marquee is outside the viewport). */
  play?: boolean
}

export const VerticalMarquee = ({
  className,
  reverse = false,
  pauseOnHover = false,
  repeat = 4,
  play = true,
  children,
  ...props
}: VerticalMarqueeProps) => (
  <div
    className={cn(
      'group flex flex-col overflow-hidden [--gap:1rem] [gap:var(--gap)]',
      className,
    )}
    {...props}
  >
    {Array.from({ length: repeat }, (_, i) => (
      <div
        key={i}
        aria-hidden={i > 0 || undefined}
        className={cn(
          'flex shrink-0 animate-marquee-vertical flex-col justify-around [gap:var(--gap)] motion-reduce:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
          !play && '[animation-play-state:paused]',
        )}
      >
        {children}
      </div>
    ))}
  </div>
)
