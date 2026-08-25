import '../styles/globals.css'

import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { MotionConfig } from 'motion/react'
import type { AppProps } from 'next/app'
import { Bricolage_Grotesque } from 'next/font/google'
import Link from 'next/link'
import { ThemeProvider } from 'next-themes'

import CookieToast from '../components/CookieToast'
import LogoMark from '../components/LogoMark'
import PageTransition from '../components/PageTransition'
import { ProgressiveBlur } from '../components/ProgressiveBlur'
import SiteFooter from '../components/SiteFooter'
import SiteNav from '../components/SiteNav'
import { SquircleFilter } from '../components/SquircleFilter'
import { ThemeToggleButton } from '../components/ThemeToggle'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

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

            <SiteFooter />
          </div>
        </PageTransition>
        <CookieToast />
      </MotionConfig>
    </ThemeProvider>
  )
}

export default MyApp
