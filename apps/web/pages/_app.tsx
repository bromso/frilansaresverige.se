import '../styles/globals.css'

import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { MotionConfig } from 'motion/react'
import type { AppProps } from 'next/app'
import { Bricolage_Grotesque } from 'next/font/google'
import Link from 'next/link'
import { ThemeProvider } from 'next-themes'

import CookieToast from '../components/CookieToast'
import PageTransition from '../components/PageTransition'
import { ProgressiveBlur } from '../components/ProgressiveBlur'
import SiteNav from '../components/SiteNav'
import { SquircleFilter } from '../components/SquircleFilter'
import { ThemeToggleButton } from '../components/ThemeToggle'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

// The logo mark on its own (the coral circle + cream shape), cropped out
// of the full wordmark SVG for use in the header and footer.
const LogoMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 59 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M20.5186 38.1889C30.6202 38.1889 38.8091 29.9879 38.8091 19.8716C38.8091 9.75526 30.6202 1.55434 20.5186 1.55434C10.417 1.55434 2.22803 9.75526 2.22803 19.8716C2.22803 29.9879 10.417 38.1889 20.5186 38.1889Z"
      fill="#FF9C8E"
    />
    <path
      d="M38.8093 19.8717C38.8093 9.75528 46.9983 1.55432 57.1 1.55432V38.1889H38.8093V19.8717Z"
      className="fill-brand-cream"
    />
  </svg>
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <SquircleFilter />
        <ProgressiveBlur position="bottom" />
        <PageTransition>
          <div
            className={`${bricolage.variable} relative z-[1] flex min-h-full flex-col`}
          >
            <header className="sticky top-0 z-10 w-full bg-brand-blue/85 backdrop-blur-md">
              <div className="mx-auto flex w-full max-w-[72em] items-center justify-between gap-4 px-[min(2em,4vw)] py-4">
                <Link
                  href="/"
                  title="Gå till startsidan"
                  className="flex items-center gap-3"
                >
                  <LogoMark className="h-9 w-auto" />
                  <span className="font-display text-lg font-bold tracking-tight text-brand-cream max-[400px]:sr-only">
                    Frilansare Sverige
                  </span>
                </Link>

                <div className="hidden md:block">
                  <SiteNav />
                </div>

                <div className="flex items-center gap-3">
                  <ThemeToggleButton variant="circle-blur" start="top-right" />
                  <Button
                    asChild
                    variant="primary"
                    size="none"
                    className="px-5 py-2 text-base"
                  >
                    <Link href="/ansokan">Ansök om medlemskap</Link>
                  </Button>
                </div>
              </div>

              <div className="flex justify-center pb-3 md:hidden">
                <SiteNav />
              </div>
            </header>

            <main className="relative z-[2] flex w-full flex-1 flex-col items-center px-[min(2em,4vw)]">
              <Component {...pageProps} />
            </main>

            <footer className="relative z-[2] mt-auto w-full bg-brand-blue-dark/70">
              {/* The fixed progressive-blur strip covers the bottom ~150px
                  of the viewport, so the footer needs extra bottom padding
                  to keep its last row readable above the blur. */}
              <div className="mx-auto flex w-full max-w-[72em] flex-wrap justify-between gap-10 px-[min(2em,4vw)] pt-12 pb-40">
                <div className="max-w-[24em]">
                  <Link
                    href="/"
                    title="Gå till startsidan"
                    className="flex items-center gap-3"
                  >
                    <LogoMark className="h-8 w-auto" />
                    <span className="font-display text-lg font-bold tracking-tight">
                      Frilansare Sverige
                    </span>
                  </Link>
                  <p className="mt-4 leading-relaxed text-brand-cream/70">
                    Sveriges största community för frilansare. Vi främjar
                    kontaktskapande och uppdragstipsande mellan frilansare —
                    helt gratis, utan mellanhänder.
                  </p>
                </div>

                <nav aria-label="Sidfot">
                  <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-brand-coral uppercase">
                    Hitta rätt
                  </h2>
                  <ul className="flex flex-col gap-2 text-brand-cream/85">
                    <li>
                      <Link
                        href="/"
                        className="hover:text-brand-cream hover:underline"
                      >
                        Startsidan
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/ansokan"
                        className="hover:text-brand-cream hover:underline"
                      >
                        Ansök om medlemskap
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/tipsa"
                        className="hover:text-brand-cream hover:underline"
                      >
                        Tipsa om konsultuppdrag
                      </Link>
                    </li>
                    <li>
                      <a
                        href="https://uppdrag.frilansaresverige.se/"
                        className="hover:text-brand-cream hover:underline"
                      >
                        Uppdragsportalen
                      </a>
                    </li>
                  </ul>
                </nav>

                <div className="max-w-[20em]">
                  <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-brand-coral uppercase">
                    Öppen källkod
                  </h2>
                  <p className="mb-3 leading-relaxed text-brand-cream/70">
                    Den här sidan byggs av communityt. Bidra gärna!
                  </p>
                  <a
                    href="https://github.com/frilansaresverige/frilansaresverige.se/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-brand-cream hover:underline"
                  >
                    GitHub
                    <span
                      className="icon-[simple-icons--github] size-5"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </PageTransition>
        <CookieToast />
      </MotionConfig>
    </ThemeProvider>
  )
}

export default MyApp
