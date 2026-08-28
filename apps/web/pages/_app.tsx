import '../styles/globals.css'

import { MotionConfig } from 'motion/react'
import type { AppProps } from 'next/app'
import { Bricolage_Grotesque } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

import CookieToast from '../components/CookieToast'
import PageTransition from '../components/PageTransition'
import { ProgressiveBlur } from '../components/ProgressiveBlur'
import SiteFooter from '../components/SiteFooter'
import SiteNav from '../components/SiteNav'
import { SquircleFilter } from '../components/SquircleFilter'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

function MyApp({ Component, pageProps, router }: AppProps) {
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
            <header className="sticky top-0 z-10 w-full">
              {/* One glass pill carries logo, tabs and theme toggle — see
                  SiteNav. */}
              <div className="mx-auto flex w-full max-w-[72em] items-center justify-center px-[min(2em,4vw)] py-4">
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
