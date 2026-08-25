import Link from 'next/link'
import { LEGAL_ROUTES, NAV_TABS } from '../lib/routes'
import LogoMark from './LogoMark'

const SiteFooter = () => (
  <footer className="relative z-[2] mt-auto w-full bg-brand-blue-dark/70">
    {/* The fixed progressive-blur strip covers the bottom ~150px of the
        viewport, so the footer needs extra bottom padding to keep its
        last row readable above the blur. That padding lives on this
        content row (pb-40); the legal row below it only needs pb-10. */}
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
          Sveriges största community för frilansare. Vi främjar kontaktskapande
          och uppdragstipsande mellan frilansare — helt gratis, utan
          mellanhänder.
        </p>
      </div>

      <nav aria-label="Sidfot" className="flex flex-wrap gap-10">
        {NAV_TABS.map((tab) => (
          <div key={tab.hub}>
            <h2 className="font-display mb-4 text-sm font-bold tracking-widest text-brand-coral uppercase">
              <Link href={tab.hub} className="hover:underline">
                {tab.title}
              </Link>
            </h2>
            <ul className="flex flex-col gap-2 text-brand-cream/85">
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

    <div className="mx-auto flex w-full max-w-[72em] flex-wrap gap-x-6 gap-y-2 px-[min(2em,4vw)] pb-10 text-sm text-brand-cream/60">
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
  </footer>
)

export default SiteFooter
