import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { cn } from '@frilansaresverige/ui/lib/utils'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Link from 'next/link'
import Router from 'next/router'
import { useEffect, useId, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'
import { NAV_TABS } from '../lib/routes'

// Site navigation adapted from Skiper UI's Skiper96 expandable tabs
// (skiper-ui.com): five icon tabs that expand to show their label on
// selection, with a panel above listing the section's pages. Changes
// from the demo: framer-motion → this repo's motion package,
// lucide-react → iconify classes, usehooks-ts click-outside → a local
// pointerdown listener, plus Escape/route-change closing, aria-expanded
// for keyboard users, and instant transitions under reduced motion.
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

  return (
    <div ref={containerRef} className="relative">
      <MotionConfig
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.5, type: 'spring', bounce: 0 }
        }
      >
        <nav
          aria-label="Huvudmeny"
          className="flex h-10 items-center gap-1 rounded-2xl bg-brand-cream/5 p-1"
        >
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
                'flex h-full items-center justify-center rounded-xl text-sm font-medium transition-colors duration-300',
                selected === index
                  ? 'bg-brand-cream/10 text-brand-cream'
                  : 'text-brand-cream/70 hover:bg-brand-cream/10 hover:text-brand-cream',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(navTab.icon, 'size-4 shrink-0')}
              />
              <AnimatePresence initial={false}>
                {selected === index ? (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={reduced ? { duration: 0 } : transition}
                    className="overflow-hidden font-medium tracking-tight whitespace-nowrap"
                  >
                    {navTab.title}
                  </motion.span>
                ) : (
                  <span className="sr-only">{navTab.title}</span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        <motion.div
          id={panelId}
          initial={false}
          animate={{ height: tab ? bounds.height : 0 }}
          className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-2xl bg-brand-blue-dark shadow-lg"
        >
          <div ref={panelRef}>
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
                  className="flex flex-col gap-0.5 p-2"
                >
                  <li>
                    <Link
                      href={tab.hub}
                      className="flex h-10 items-center rounded-xl px-3 text-sm font-bold text-brand-cream hover:bg-brand-cream/10"
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
                        className="flex h-10 items-center rounded-xl px-3 text-sm text-brand-cream/85 hover:bg-brand-cream/10 hover:text-brand-cream"
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
