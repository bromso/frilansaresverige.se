import type { CSSProperties } from 'react'

// Adapted from Skiper UI's Skiper41 progressive blur (skiper-ui.com,
// inspired by devouringdetails.com): a strip that fades to the page
// background while progressively blurring whatever scrolls beneath it.
// Changes from upstream: `fixed` positioning so one instance covers the
// viewport edge for the whole page, and the background defaults to the
// brand background token so it follows the light/dark theme.
type ProgressiveBlurProps = {
  className?: string
  backgroundColor?: string
  position?: 'top' | 'bottom'
  height?: string
  blurAmount?: string
  /** 'fixed' pins the strip to the viewport edge (the site-wide bottom
      strip); 'absolute' pins it to the nearest positioned ancestor, for
      fading content in and out at a section's edges. */
  attachment?: 'fixed' | 'absolute'
}

export const ProgressiveBlur = ({
  className = '',
  backgroundColor = 'var(--color-brand-blue)',
  position = 'bottom',
  height = '150px',
  blurAmount = '4px',
  attachment = 'fixed',
}: ProgressiveBlurProps) => {
  const isTop = position === 'top'

  const style: CSSProperties = {
    [isTop ? 'top' : 'bottom']: 0,
    height,
    background: isTop
      ? `linear-gradient(to top, transparent, ${backgroundColor})`
      : `linear-gradient(to bottom, transparent, ${backgroundColor})`,
    maskImage: isTop
      ? 'linear-gradient(to bottom, black 50%, transparent)'
      : 'linear-gradient(to top, black 50%, transparent)',
    WebkitBackdropFilter: `blur(${blurAmount})`,
    backdropFilter: `blur(${blurAmount})`,
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${attachment === 'fixed' ? 'fixed z-40' : 'absolute z-10'} left-0 w-full select-none ${className}`}
      style={style}
    />
  )
}
