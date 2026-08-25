import { cn } from '@frilansaresverige/ui/lib/utils'
import { motion } from 'motion/react'
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
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal-${start}${blur ? '-blur' : ''};
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
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal${blur ? '-blur' : ''};
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
    return {
      name: `${variant}-${start}`,
      css: `
      ::view-transition-group(root) {
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        mask: url('${svg}') ${start === 'center' ? 'center' : start.replace('-', ' ')} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale 1s;
        transform-origin: ${transformOrigin};
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale 1s;
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
        'size-10 cursor-pointer rounded-full bg-black p-0 transition-all duration-300 active:scale-95',
        className,
      )}
      onClick={toggleTheme}
      aria-label="Växla mellan mörkt och ljust läge"
    >
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <motion.g
          animate={{ rotate: isDark ? -180 : 0 }}
          transition={{ ease: 'easeInOut', duration: 0.5 }}
        >
          <path
            d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5"
            fill="white"
          />
          <path
            d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5"
            fill="black"
          />
        </motion.g>
        <motion.path
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ ease: 'easeInOut', duration: 0.5 }}
          d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 67.5 214.5 120C214.5 172.5 172.5 214.5 120 214.5Z"
          fill="white"
        />
      </svg>
    </button>
  )
}
