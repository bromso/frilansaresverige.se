import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { cn } from '@frilansaresverige/ui/lib/utils'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Link from 'next/link'
import Router from 'next/router'
import { useEffect, useId, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'
import { NAV_TABS } from '../lib/routes'
import LogoMark from './LogoMark'
import { ThemeToggleButton } from './ThemeToggle'

// Site navigation adapted from Skiper UI's Skiper96 expandable tabs
// (skiper-ui.com): five icon tabs that expand to show their label on
// selection, with a panel above listing the section's pages. Changes
// from the demo: framer-motion → this repo's motion package,
// lucide-react → iconify classes, usehooks-ts click-outside → a local
// pointerdown listener, plus Escape/route-change closing, aria-expanded
// for keyboard users, and instant transitions under reduced motion.
// The bar also carries the logo (left) and the theme toggle (right) so
// the header is a single glass pill; every element inside shares the
// pill's 40px inner row (h-14 minus p-2). Text and hovers use the brand
// tokens, which .light swaps, so the ink inverts with the background.
const transition = {
  delay: 0.1,
  type: 'spring' as const,
  bounce: 0,
  duration: 0.6,
}

const SiteNav = () => {
  const [selected, setSelected] = useState<number | null>(null)
  const [direction, setDirection] = useState(1)
  const [panelRef, bounds] = useMeasure()
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const panelId = useId()

  useEffect(() => {
    const close = () => setSelected(null)
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    Router.events.on('routeChangeStart', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      Router.events.off('routeChangeStart', close)
    }
  }, [])

  const selectTab = (index: number) => {
    if (selected === index) {
      setSelected(null)
      return
    }
    if (selected !== null) {
      setDirection(index > selected ? 1 : -1)
    }
    setSelected(index)
  }

  const tab = selected === null ? null : NAV_TABS[selected]

  // The root reserves the bar's 56px in the sticky header while the glass
  // container below grows past it, so expanding the panel overlays the
  // page instead of pushing it down.
  return (
    <div ref={containerRef} className="relative h-14">
      <MotionConfig
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.5, type: 'spring', bounce: 0 }
        }
      >
        {/* One morphing surface, like the Skiper96 demo: the tab row and
            the link panel share this glass container, whose height
            animates from the bare bar (56px) to bar + measured panel.
            The 28px radius equals the closed bar's pill radius, and the
            radii nest concentrically: outer 28px − 8px padding = 20px
            for everything inset by p-2/px-2 (the 40px pill items resolve
            to 20px via rounded-full; the panel links use 1.25rem). */}
        <motion.div
          initial={false}
          animate={{ height: tab ? 56 + bounds.height : 56 }}
          className="glass-surface relative overflow-hidden rounded-[1.75rem]"
        >
          <nav
            aria-label="Huvudmeny"
            className="flex h-14 items-center gap-1 p-2"
          >
            <Link
              href="/"
              title="Gå till startsidan"
              className="flex h-full items-center gap-2 rounded-full px-3 transition-colors duration-300 hover:bg-brand-cream/10"
            >
              <LogoMark className="h-7 w-auto" />
              <span className="sr-only">Frilansare Sverige</span>
            </Link>

            <span
              aria-hidden="true"
              className="mx-1 h-6 w-px bg-brand-cream/15"
            />

            {NAV_TABS.map((navTab, index) => (
              <motion.button
                key={navTab.title}
                type="button"
                initial={false}
                animate={{
                  gap: selected === index ? '.5rem' : 0,
                  paddingLeft: selected === index ? '1rem' : '.5rem',
                  paddingRight: selected === index ? '1rem' : '.5rem',
                }}
                onClick={() => selectTab(index)}
                aria-expanded={selected === index}
                aria-controls={panelId}
                className={cn(
                  'flex h-full items-center justify-center rounded-full text-sm font-medium transition-colors duration-300',
                  selected === index
                    ? 'bg-brand-cream/10 text-brand-cream'
                    : 'text-brand-cream/70 hover:bg-brand-cream/10 hover:text-brand-cream',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(navTab.icon, 'size-5 shrink-0')}
                />
                {/* The accessible name lives outside AnimatePresence: a
                    fallback span inside it would share the label's
                    implicit presence key, making AnimatePresence treat
                    the entering label as already present and skip its
                    width/opacity animation entirely. */}
                <span className="sr-only">{navTab.title}</span>
                <AnimatePresence initial={false}>
                  {selected === index && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={reduced ? { duration: 0 } : transition}
                      className="overflow-hidden font-medium tracking-tight whitespace-nowrap"
                    >
                      {navTab.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}

            <span
              aria-hidden="true"
              className="mx-1 h-6 w-px bg-brand-cream/15"
            />

            <ThemeToggleButton variant="circle-blur" start="top-center" />
          </nav>

          <div ref={panelRef} id={panelId}>
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={direction}
            >
              {tab && (
                <motion.ul
                  key={tab.title}
                  custom={direction}
                  variants={panelVariants}
                  initial="initial"
                  animate="active"
                  exit="exit"
                  className="flex flex-col gap-0.5 px-2 pb-2"
                >
                  <li>
                    <Link
                      href={tab.hub}
                      className="flex h-10 items-center rounded-[1.25rem] px-3 text-sm font-bold text-brand-cream hover:bg-brand-cream/10"
                    >
                      {tab.items.length === 0
                        ? tab.title
                        : `Allt om ${tab.title.toLowerCase()}`}
                    </Link>
                  </li>
                  {tab.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className="flex h-10 items-center rounded-[1.25rem] px-3 text-sm text-brand-cream/85 hover:bg-brand-cream/10 hover:text-brand-cream"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  )
}

const panelVariants = {
  initial: (direction: number) => ({ x: `${110 * direction}%`, opacity: 0 }),
  active: { x: '0%', opacity: 1 },
  exit: (direction: number) => ({ x: `${-110 * direction}%`, opacity: 0 }),
}

export default SiteNav
