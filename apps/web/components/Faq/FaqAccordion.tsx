import { cn } from '@frilansaresverige/ui/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { FaqItem } from './faq-items'

// Skiper UI's Skiper103 bouncy accordion (skiper-ui.com, inspired by
// @dev_ya): the list items sit joined together, and the active one springs
// apart from its neighbors with animated margins and corner radii while its
// answer blur-fades in. Adapted from the original: framer-motion → this
// repo's motion package, the demo's Nucleo glass icons → iconify icons,
// fixed pixel heights → height auto (the Swedish answers wrap), and the row
// is a real <button> with aria-expanded for keyboard users.
const FaqAccordion = ({ items }: { items: FaqItem[] }) => {
  const [activeItem, setActiveItem] = useState<number | null>(0)

  return (
    <ul className="w-full select-none">
      {items.map((item, index) => {
        const open = activeItem === index
        const roundTop =
          index === 0 ||
          open ||
          (activeItem !== null && index === activeItem + 1)
        const roundBottom =
          index === items.length - 1 ||
          open ||
          (activeItem !== null && index === activeItem - 1)

        return (
          <motion.li
            key={item.question}
            animate={{
              marginBlock: open ? '10px' : '0px',
              borderTopLeftRadius: roundTop ? '20px' : '0px',
              borderTopRightRadius: roundTop ? '20px' : '0px',
              borderBottomRightRadius: roundBottom ? '20px' : '0px',
              borderBottomLeftRadius: roundBottom ? '20px' : '0px',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative overflow-hidden bg-brand-cream text-brand-blue"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setActiveItem(open ? null : index)}
              className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left hover:bg-brand-blue/5"
            >
              <span
                aria-hidden="true"
                className={`${item.icon} size-5 shrink-0 text-brand-blue-dark`}
              />
              <span className="font-display pr-8 text-base font-bold">
                {item.question}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'icon-[lucide--chevron-down] absolute right-5 size-4 shrink-0 transition-transform ease-in-out',
                  open && 'rotate-180',
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    filter: 'blur(0px)',
                  }}
                  exit={{ height: 0, opacity: 0, filter: 'blur(2px)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[36em] px-5 pb-5 pl-13 leading-[1.6] text-brand-blue/80">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        )
      })}
    </ul>
  )
}

export default FaqAccordion
