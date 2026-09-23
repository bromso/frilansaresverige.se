import { cn } from '@frilansaresverige/ui/lib/utils'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'

// Adapted from Skiper UI's Skiper26 theme toggle (skiper-ui.com, itself an
// inspired rebuild of rudrodip/theme-toggle-effect): the theme switch runs
// inside a View Transition whose reveal shape is injected as a <style>
// right before the switch. Changes from upstream: framer-motion → this
// repo's motion package, the demo page/options panel and remote gif
// presets are dropped, and under reduced motion (or browsers without the
// View Transition API) the theme just switches instantly. The other
// upstream variants (rectangle, polygon, circle-blur, off-center starts,
// the blur option) were removed for bundle size: only the circle reveal
// from the center is ever used.

// The circle-from-center reveal, exactly as upstream generated it for
// variant "circle", start "center", blur off.
const CIRCLE_CENTER_CSS = `
      ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        animation-name: reveal;
        animation-fill-mode: forwards;
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      .dark::view-transition-new(root) {
        animation-name: reveal;
        animation-fill-mode: forwards;
      }
      @keyframes reveal {
        from {
          clip-path: circle(0% at 50% 50%);
        }
        to {
          clip-path: circle(100.0% at 50% 50%);
        }
      }
      `

const STYLE_ID = 'theme-transition-styles'

export const useThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  // The theme is only known after hydration; the default theme is dark,
  // so start there rather than painting the wrong icon for a frame for
  // the majority of visitors.
  const [isDark, setIsDark] = useState(true)

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

    updateStyles(CIRCLE_CENTER_CSS)
    document.startViewTransition(switchTheme)
  }, [theme, setTheme, updateStyles, isDark])

  return { isDark, toggleTheme }
}

// The button shows the sun/moon pair animate-ui's theme toggler uses
// (lucide icons, via this repo's iconify classes instead of lucide-react):
// the sun while the site is dark (inviting the switch to light) and the
// moon in light mode. Ink and hover match the nav tabs next to it, so the
// icon inverts with the theme like the rest of the bar.
export const ThemeToggleButton = ({
  className = '',
}: {
  className?: string
}) => {
  const { isDark, toggleTheme } = useThemeToggle()

  return (
    <button
      type="button"
      className={cn(
        'flex size-10 cursor-pointer items-center justify-center rounded-full text-brand-cream/75 transition-colors duration-300 hover:bg-brand-cream/10 hover:text-brand-cream active:scale-95',
        className,
      )}
      onClick={toggleTheme}
      aria-label={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
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
