import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'

// Cookie notice as a bottom-center toast, visually adapted from a
// motion/react toast-stack pattern (spring entrance from below, compact
// card with icon, copy and a dismiss control) instead of the old
// full-width react-cookie-consent bar. Uses the same cookie name and
// value as the old banner, so consents that were already given keep
// counting. Accepting stores the cookie for a year; the X dismisses for
// this visit only, so the notice returns next time. Global MotionConfig
// (reducedMotion="user") disables the spring under reduced motion.
const COOKIE_NAME = 'frilansareSverigeKanAnvandaAnalyticsDetGarBra'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

const hasConsentCookie = () =>
  document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${COOKIE_NAME}=`))

const CookieToast = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!hasConsentCookie()) {
      const timeout = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(timeout)
    }
  }, [])

  const answer = (consented: boolean) => {
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is still Chromium-only; document.cookie is the portable way to set the consent cookie
    document.cookie = `${COOKIE_NAME}=${consented}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`
    setOpen(false)
  }

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2"
      style={{ perspective: 800 }}
    >
      <AnimatePresence initial={false}>
        {open && (
          <m.section
            aria-label="Information om cookies"
            className="pointer-events-auto flex origin-bottom items-start gap-3 rounded-2xl border border-brand-cream/15 bg-brand-blue-dark p-4 text-brand-cream shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
            initial={{ opacity: 0, y: 60, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: 20,
              transition: { duration: 0.2, ease: 'easeIn' },
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span aria-hidden="true" className="shrink-0 text-xl leading-none">
              🍪
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm leading-tight font-bold">
                Cookies
              </p>
              <p className="mt-0.5 text-[0.8rem] leading-snug text-brand-cream/60">
                Vi använder cookies för att se hur många besökare det kommer
                till denna sida.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="none"
                  className="px-4 py-1.5 text-sm"
                  onClick={() => answer(true)}
                >
                  Okej det går väl bra
                </Button>
                <Button
                  variant="primary-outline"
                  size="none"
                  className="px-4 py-1.5 text-sm"
                  onClick={() => answer(false)}
                >
                  Nej
                </Button>
              </div>
            </div>
          </m.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CookieToast
