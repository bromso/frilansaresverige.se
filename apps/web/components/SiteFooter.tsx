import Link from 'next/link'
import { LEGAL_ROUTES, NAV_TABS } from '../lib/routes'
import Breadcrumbs from './Breadcrumbs'
import LogoMark from './LogoMark'

const GITHUB_URL = 'https://github.com/frilansaresverige/frilansaresverige.se/'

// Layout after the Tailwind Plus 4-column footer: the brand blurb beside
// the link columns, and a hairline-divided bottom bar carrying copyright,
// legal links and social icons. Recolored to the site's ink-on-ground
// tokens.
//
// `path` is the current route's pathname, passed down from _app's router
// prop (useRouter() throws when the footer renders outside a Next router,
// as it does in unit tests). Breadcrumbs sit at the top of the footer
// (Apple-style); on routes without a parent chain — including the '/'
// default — the component renders nothing.
const SiteFooter = ({ path = '/' }: { path?: string }) => {
  return (
    <footer className="relative z-[2] mt-auto w-full bg-brand-blue-dark/70">
      <div className="mx-auto w-full max-w-[72em] px-[min(2em,4vw)]">
        <Breadcrumbs path={path} />

        {/* Brand blurb + link columns */}
        <div className="pt-12 pb-12 xl:grid xl:grid-cols-3 xl:gap-8">
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
              kontaktskapande och uppdragstipsande mellan frilansare — helt
              gratis, utan mellanhänder.
            </p>
            <p className="mt-3 leading-relaxed text-brand-cream/70">
              Sajten byggs av communityt och koden är öppen —{' '}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cream hover:underline"
              >
                bidra gärna
              </a>
              .
            </p>
          </div>

          <nav
            aria-label="Sidfot"
            className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:mt-0"
          >
            {NAV_TABS.map((tab) => (
              <div key={tab.hub}>
                <h3 className="font-display text-sm font-bold tracking-widest text-brand-coral uppercase">
                  <Link href={tab.hub} className="hover:underline">
                    {tab.title}
                  </Link>
                </h3>
                <ul className="mt-6 space-y-4 text-sm text-brand-cream/85">
                  {tab.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className="hover:text-brand-cream hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {tab.hub === '/uppdrag' && (
                    <li>
                      <a
                        href="https://uppdrag.frilansaresverige.se/"
                        className="hover:text-brand-cream hover:underline"
                      >
                        Uppdragsportalen
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar: copyright + legal links left, social right. The
            fixed progressive-blur strip covers the bottom ~150px of the
            viewport, so the generous pb-40 keeps this row readable above
            the blur. */}
        <div className="border-t border-brand-cream/10 pt-8 pb-40 md:flex md:items-center md:justify-between">
          <div className="flex gap-x-6 md:order-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cream/60 hover:text-brand-cream"
            >
              <span className="sr-only">GitHub</span>
              <span
                className="icon-[simple-icons--github] size-6"
                aria-hidden="true"
              />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-cream/60 md:order-1 md:mt-0">
            <span>© {new Date().getFullYear()} Frilansare Sverige</span>
            {LEGAL_ROUTES.map((legal) => (
              <Link
                key={legal.path}
                href={legal.path}
                className="hover:text-brand-cream hover:underline"
              >
                {legal.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
