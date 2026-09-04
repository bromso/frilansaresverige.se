import '../styles/globals.css'

import { MotionConfig } from 'motion/react'
import type { AppProps } from 'next/app'
import { Bricolage_Grotesque } from 'next/font/google'
import Head from 'next/head'
import { ThemeProvider } from 'next-themes'

import CookieToast from '../components/CookieToast'
import SiteFooter from '../components/SiteFooter'
import SiteNav from '../components/SiteNav'

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
        <Head>
          {/* Lighthouse flags the default viewport as tap-delay prone;
              initial-scale=1 removes the up-to-300ms delay on mobile. */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div
          className={`${bricolage.variable} relative z-[1] flex min-h-full flex-col`}
        >
          <header className="sticky top-0 z-10 w-full">
            {/* Full-width mega-menu bar — see SiteNav / ui MegaNav. */}
            <SiteNav />
          </header>

          <main className="relative z-[2] flex w-full flex-1 flex-col items-center px-[min(2em,4vw)]">
            <Component {...pageProps} />
          </main>

          <SiteFooter path={router.pathname} crumb={pageProps.crumb} />
        </div>
        <CookieToast />
      </MotionConfig>
    </ThemeProvider>
  )
}

export default MyApp
