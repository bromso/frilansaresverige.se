import { cn } from '@frilansaresverige/ui/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState } from 'react'

// FAQ for the membership application page, built on Skiper UI's Skiper103
// bouncy accordion (skiper-ui.com, inspired by @dev_ya): the list items
// sit joined together, and the active one springs apart from its
// neighbors with animated margins and corner radii while its answer
// blur-fades in. Adapted from the original: framer-motion → this repo's
// motion package, the demo's Nucleo glass icons → iconify icons, fixed
// pixel heights → height auto (the Swedish answers wrap), and the row is
// a real <button> with aria-expanded for keyboard users. Answers stick
// to what the site already says elsewhere (the hero, the "Så går det
// till" steps and the tipsa page) so no policy is invented here.
const FAQ_ITEMS: { icon: string; question: string; answer: ReactNode }[] = [
  {
    icon: 'icon-[lucide--users]',
    question: 'Vem kan bli medlem?',
    answer:
      'Communityt är till för dig som redan är igång som frilansare — med ett bolag att fakturera genom och minst en kund. Alla branscher är välkomna: utvecklare, designers, skribenter, fotografer, projektledare, ekonomer och många fler.',
  },
  {
    icon: 'icon-[lucide--wallet]',
    question: 'Vad kostar medlemskapet?',
    answer:
      'Ingenting. Det finns ingen medlemsavgift, inga premiumnivåer och inga mellanhänder — communityt drivs av medlemmarna själva.',
  },
  {
    icon: 'icon-[lucide--send]',
    question: 'Hur går ansökan till?',
    answer:
      'Berätta kort om vad du gör och länka till din LinkedIn — det tar bara ett par minuter. Vi tittar på ansökan och godkänner dig som redan är igång som frilansare.',
  },
  {
    icon: 'icon-[lucide--party-popper]',
    question: 'Vad händer när jag blivit godkänd?',
    answer:
      'Du får en inbjudan till vår Slack via mejl. Hoppa in, presentera dig och hitta kanalerna som passar din bransch eller din stad.',
  },
  {
    icon: 'icon-[simple-icons--slack]',
    question: 'Var händer allt?',
    answer:
      'Allt händer i vår Slack — trådar, kanaler och direktmeddelanden. Där delar medlemmarna uppdrag, kunskap och kollegskap varje dag.',
  },
  {
    icon: 'icon-[lucide--briefcase]',
    question: 'Jag söker en konsult — ska jag också ansöka?',
    answer: (
      <>
        Nej, medlemskapet är för frilansare. Har du eller ditt företag ett
        konsultbehov kan du i stället{' '}
        <Link href="/tipsa" className="underline hover:no-underline">
          tipsa om uppdraget
        </Link>{' '}
        — gratis och utan mellanhänder.
      </>
    ),
  },
]

const AnsokanFaq = () => {
  const [activeItem, setActiveItem] = useState<number | null>(0)

  return (
    <section
      aria-label="Vanliga frågor om medlemskapet"
      className="mx-auto mt-8 mb-16 w-full max-w-[44em] select-none"
    >
      <h2 className="font-display mb-2 text-sm font-bold tracking-widest text-brand-coral uppercase">
        Vanliga frågor
      </h2>
      <p className="font-display mb-6 text-2xl font-extrabold tracking-tight text-brand-cream md:text-3xl">
        Innan du ansöker
      </p>
      <ul className="w-full">
        {FAQ_ITEMS.map((item, index) => {
          const open = activeItem === index
          const roundTop =
            index === 0 ||
            open ||
            (activeItem !== null && index === activeItem + 1)
          const roundBottom =
            index === FAQ_ITEMS.length - 1 ||
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
    </section>
  )
}

export default AnsokanFaq
