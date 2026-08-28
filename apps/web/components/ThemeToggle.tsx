import { cn } from '@frilansaresverige/ui/lib/utils'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'

// Adapted from Skiper UI's Skiper26 theme toggle (skiper-ui.com, itself an
// inspired rebuild of rudrodip/theme-toggle-effect): the theme switch runs
// inside a View Transition whose reveal shape is injected as a <style>
// right before the switch. Changes from upstream: framer-motion → this
// repo's motion package, the demo page/options panel and remote gif
// presets are dropped, and under reduced motion (or browsers without the
// View Transition API) the theme just switches instantly.

export type AnimationVariant =
  | 'circle'
  | 'rectangle'
  | 'polygon'
  | 'circle-blur'
export type AnimationStart =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'bottom-up'
  | 'top-down'
  | 'left-right'
  | 'right-left'

interface Animation {
  name: string
  css: string
}

const getPositionCoords = (position: AnimationStart) => {
  switch (position) {
    case 'top-left':
      return { cx: '0', cy: '0' }
    case 'top-right':
      return { cx: '40', cy: '0' }
    case 'bottom-left':
      return { cx: '0', cy: '40' }
    case 'bottom-right':
      return { cx: '40', cy: '40' }
    case 'top-center':
      return { cx: '20', cy: '0' }
    case 'bottom-center':
      return { cx: '20', cy: '40' }
    default:
      return { cx: '20', cy: '20' }
  }
}

const generateSVG = (variant: AnimationVariant, start: AnimationStart) => {
  const { cx, cy } = getPositionCoords(start)

  if (variant === 'circle-blur') {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${start === 'center' ? '20' : cx}" cy="${start === 'center' ? '20' : cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`
  }
  if (variant === 'circle') {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="${cx}" cy="${cy}" r="20" fill="white"/></svg>`
  }
  return ''
}

const getTransformOrigin = (start: AnimationStart) => {
  switch (start) {
    case 'top-left':
      return 'top left'
    case 'top-right':
      return 'top right'
    case 'bottom-left':
      return 'bottom left'
    case 'bottom-right':
      return 'bottom right'
    case 'top-center':
      return 'top center'
    case 'bottom-center':
      return 'bottom center'
    default:
      return 'center'
  }
}

export const createAnimation = (
  variant: AnimationVariant,
  start: AnimationStart = 'center',
  blur = false,
): Animation => {
  const svg = generateSVG(variant, start)
  const transformOrigin = getTransformOrigin(start)

  if (variant === 'rectangle') {
    const getClipPath = (direction: AnimationStart) => {
      switch (direction) {
        case 'top-down':
          return {
            from: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'left-right':
          return {
            from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'right-left':
          return {
            from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        default:
          return {
            from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
      }
    }

    const clipPath = getClipPath(start)

    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
      ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        animation-name: reveal-${start}${blur ? '-blur' : ''};
        animation-fill-mode: forwards;
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-${start}${blur ? '-blur' : ''};
        animation-fill-mode: forwards;
        ${blur ? 'filter: blur(2px);' : ''}
      }
      @keyframes reveal-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: ${clipPath.from};
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: ${clipPath.to};
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
      `,
    }
  }

  if (variant === 'circle' && start === 'center') {
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
      ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        animation-name: reveal${blur ? '-blur' : ''};
        animation-fill-mode: forwards;
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal${blur ? '-blur' : ''};
        animation-fill-mode: forwards;
      }
      @keyframes reveal${blur ? '-blur' : ''} {
        from {
          clip-path: circle(0% at 50% 50%);
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(100.0% at 50% 50%);
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
      `,
    }
  }

  if (variant === 'circle-blur') {
    // `forwards` is load-bearing: without it the scale animation reverts
    // to the base mask-size of 0 on the frame it finishes — one frame
    // before the transition tears down — masking the new snapshot away
    // and flashing the old theme.
    return {
      name: `${variant}-${start}`,
      css: `
      ::view-transition-group(root) {
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        mask: url('${svg}') ${start === 'center' ? 'center' : start.replace('-', ' ')} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale 1s forwards;
        transform-origin: ${transformOrigin};
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale 1s forwards;
        transform-origin: ${transformOrigin};
        z-index: -1;
      }
      @keyframes scale {
        to {
          mask-size: 350vmax;
        }
      }
      `,
    }
  }

  if (variant === 'polygon') {
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
      ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        animation-name: reveal-${start}${blur ? '-blur' : ''};
        animation-fill-mode: forwards;
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-${start}${blur ? '-blur' : ''};
        animation-fill-mode: forwards;
      }
      @keyframes reveal-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: polygon(50% -71%, -50% 71%, -50% 71%, 50% -71%);
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: polygon(50% -71%, -50% 71%, 50% 171%, 171% 50%);
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
      `,
    }
  }

  // circle with a non-center start position
  const getClipPathPosition = (position: AnimationStart) => {
    switch (position) {
      case 'top-left':
        return '0% 0%'
      case 'top-right':
        return '100% 0%'
      case 'bottom-left':
        return '0% 100%'
      case 'bottom-right':
        return '100% 100%'
      case 'top-center':
        return '50% 0%'
      case 'bottom-center':
        return '50% 100%'
      default:
        return '50% 50%'
    }
  }

  const clipPosition = getClipPathPosition(start)

  return {
    name: `${variant}-${start}${blur ? '-blur' : ''}`,
    css: `
    ::view-transition-group(root) {
      animation-duration: 1s;
      animation-timing-function: var(--expo-out);
    }
    ::view-transition-new(root) {
      animation-name: reveal-${start}${blur ? '-blur' : ''};
      ${blur ? 'filter: blur(2px);' : ''}
    }
    ::view-transition-old(root),
    .dark::view-transition-old(root) {
      animation: none;
      z-index: -1;
    }
    .dark::view-transition-new(root) {
      animation-name: reveal-${start}${blur ? '-blur' : ''};
    }
    @keyframes reveal-${start}${blur ? '-blur' : ''} {
      from {
        clip-path: circle(0% at ${clipPosition});
        ${blur ? 'filter: blur(8px);' : ''}
      }
      ${blur ? '50% { filter: blur(4px); }' : ''}
      to {
        clip-path: circle(150.0% at ${clipPosition});
        ${blur ? 'filter: blur(0px);' : ''}
      }
    }
    `,
  }
}

const STYLE_ID = 'theme-transition-styles'

export const useThemeToggle = ({
  variant = 'circle',
  start = 'center',
  blur = false,
}: {
  variant?: AnimationVariant
  start?: AnimationStart
  blur?: boolean
} = {}) => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(resolvedTheme === 'dark')
  }, [resolvedTheme])

  const updateStyles = useCallback((css: string) => {
    let styleElement = document.getElementById(
      STYLE_ID,
    ) as HTMLStyleElement | null
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = STYLE_ID
      document.head.appendChild(styleElement)
    }
    styleElement.textContent = css
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(!isDark)

    const switchTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reducedMotion || !document.startViewTransition) {
      switchTheme()
      return
    }

    const animation = createAnimation(variant, start, blur)
    updateStyles(animation.css)
    document.startViewTransition(switchTheme)
  }, [theme, setTheme, variant, start, blur, updateStyles, isDark])

  return { isDark, toggleTheme }
}

// The button shows the sun/moon pair animate-ui's theme toggler uses
// (lucide icons, via this repo's iconify classes instead of lucide-react):
// the sun while the site is dark (inviting the switch to light) and the
// moon in light mode. Ink and hover match the nav tabs next to it, so the
// icon inverts with the theme like the rest of the bar.
export const ThemeToggleButton = ({
  className = '',
  variant = 'circle',
  start = 'center',
  blur = false,
}: {
  className?: string
  variant?: AnimationVariant
  start?: AnimationStart
  blur?: boolean
}) => {
  const { isDark, toggleTheme } = useThemeToggle({ variant, start, blur })

  return (
    <button
      type="button"
      className={cn(
        'flex size-10 cursor-pointer items-center justify-center rounded-full text-brand-cream/70 transition-colors duration-300 hover:bg-brand-cream/10 hover:text-brand-cream active:scale-95',
        className,
      )}
      onClick={toggleTheme}
      aria-label="Växla mellan mörkt och ljust läge"
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-5',
          isDark ? 'icon-[lucide--sun]' : 'icon-[lucide--moon]',
        )}
      />
    </button>
  )
}
