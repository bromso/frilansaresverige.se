'use client'

import { AnimatePresence, motion } from 'motion/react'
import {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import { cn } from '../lib/utils'

// Apple-style mega menu, adapted from Skiper UI's Skiper38 Navbar_002
// (skiper-ui.com, an apple.com-inspired study). Changes from upstream:
// framer-motion → this repo's motion package, lucide-react → iconify
// classes, hardcoded Apple data → a MegaNavItem[] prop, plain <li>s →
// real links via an injectable LinkComponent (so Next apps pass
// next/link without this package depending on Next), brand tokens
// instead of Apple's palette, hover AND focus opening with
// aria-expanded, Escape/link-click closing, and the full-screen
// backdrop-blur overlay swapped for a plain dim (no backdrop-filter —
// see the repo's rendering-performance history).

export interface MegaNavLink {
  label: string
  href: string
}

export interface MegaNavSection {
  title: string
  links: MegaNavLink[]
  /** Large sections render their links in display size with a chevron. */
  large?: boolean
}

export interface MegaNavItem {
  label: string
  href: string
  /** Without sections the item is a plain link — no dropdown. */
  sections?: MegaNavSection[]
}

type LinkLike = ComponentType<
  ComponentProps<'a'> & { href: string; prefetch?: boolean }
>

const menuItemVariants = {
  hidden: { opacity: 0, y: '-20%' },
  visible: { opacity: 1, y: 0 },
}

const menuContainerVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
}

const MenuSection = ({
  section,
  LinkComponent,
  onNavigate,
}: {
  section: MegaNavSection
  LinkComponent: LinkLike
  onNavigate: () => void
}) => (
  <motion.ul
    className="space-y-2"
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={menuContainerVariants}
  >
    <motion.li
      variants={menuItemVariants}
      transition={{ duration: 0.3 }}
      className="my-4 text-xs text-brand-cream/50"
    >
      {section.title}
    </motion.li>
    {section.links.map((link) => (
      <motion.li
        key={link.href + link.label}
        variants={menuItemVariants}
        transition={{ duration: 0.3 }}
        className="tracking-tight"
      >
        <LinkComponent
          href={link.href}
          onClick={onNavigate}
          className={cn(
            'text-brand-cream hover:underline',
            section.large
              ? 'font-display group relative flex items-center text-2xl font-semibold'
              : 'text-sm font-medium text-brand-cream/85 hover:text-brand-cream',
          )}
        >
          {link.label}
          {section.large && (
            <span
              aria-hidden="true"
              className="icon-[lucide--chevron-right] absolute -right-8 size-6 opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100"
            />
          )}
        </LinkComponent>
      </motion.li>
    ))}
  </motion.ul>
)

export const MegaNav = ({
  items,
  logo,
  actions,
  LinkComponent = 'a' as unknown as LinkLike,
  className,
}: {
  items: MegaNavItem[]
  /** Left slot, e.g. the logo linking home. */
  logo?: ReactNode
  /** Right slot, e.g. a theme toggle. */
  actions?: ReactNode
  LinkComponent?: LinkLike
  className?: string
}) => {
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const current = items.find(
    (item) => item.label === open && item.sections?.length,
  )
  const showPanel = Boolean(current) || mobileOpen

  const closeAll = () => {
    setOpen(null)
    setMobileOpen(false)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    // eslint-style note: mouse-leave closing is a convenience on top of
    // Escape and link-click closing, not the only path out.
    <nav
      aria-label="Huvudmeny"
      className={cn('isolate w-full bg-brand-blue', className)}
      onMouseLeave={() => setOpen(null)}
    >
      {/* Bar */}
      <div className="relative z-20 w-full">
        <div className="mx-auto flex h-14 w-full max-w-[72em] items-center justify-between gap-5 px-[min(2em,4vw)]">
          {logo}

          <ul className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            {items.map((item) => (
              <li key={item.label}>
                <LinkComponent
                  href={item.href}
                  onClick={closeAll}
                  onMouseEnter={() => setOpen(item.label)}
                  onFocus={() => setOpen(item.label)}
                  {...(item.sections?.length && {
                    'aria-expanded': open === item.label,
                  })}
                  className="text-sm font-medium text-brand-cream/85 transition-colors hover:text-brand-cream"
                >
                  {item.label}
                </LinkComponent>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            {actions}
            <button
              type="button"
              aria-label={mobileOpen ? 'Stäng menyn' : 'Öppna menyn'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex size-9 items-center justify-center text-brand-cream lg:hidden"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-6',
                  mobileOpen ? 'icon-[lucide--x]' : 'icon-[lucide--menu]',
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown / mobile panel */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: showPanel ? 'auto' : 0 }}
        transition={{ ease: [0.645, 0.045, 0.355, 1], duration: 0.5 }}
        className="relative z-20 w-full overflow-hidden bg-brand-blue"
      >
        <AnimatePresence mode="wait">
          {current?.sections && (
            <motion.div
              key={current.label}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="mx-auto hidden w-full max-w-[72em] gap-24 px-[min(2em,4vw)] pt-6 pb-16 lg:flex"
            >
              {current.sections.map((section) => (
                <MenuSection
                  key={section.title}
                  section={section}
                  LinkComponent={LinkComponent}
                  onNavigate={closeAll}
                />
              ))}
            </motion.div>
          )}
          {mobileOpen && (
            <motion.ul
              key="mobile"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.04, delayChildren: 0.05 },
                },
              }}
              className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-y-auto px-[min(2em,4vw)] pt-6 pb-16 lg:hidden"
            >
              {items.map((item) => (
                <motion.li key={item.label} variants={menuItemVariants}>
                  <LinkComponent
                    href={item.href}
                    onClick={closeAll}
                    className="font-display group relative flex items-center justify-between text-3xl font-semibold tracking-tight text-brand-cream"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="icon-[lucide--chevron-right] size-6 opacity-40"
                    />
                  </LinkComponent>
                  {item.sections?.[0] && (
                    <ul className="mt-3 space-y-2">
                      {item.sections[0].links.map((link) => (
                        <li key={link.href + link.label}>
                          <LinkComponent
                            href={link.href}
                            onClick={closeAll}
                            className="text-sm text-brand-cream/70 hover:text-brand-cream"
                          >
                            {link.label}
                          </LinkComponent>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Page dim while a menu is open — a plain overlay, deliberately
          without backdrop-filter. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: current ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-brand-blue-dark/60"
      />
    </nav>
  )
}
