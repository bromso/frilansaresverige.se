import Link from 'next/link'
import Seo from '../components/Seo'
import { NAV_TABS } from '../lib/routes'

const Custom404 = () => (
  <section className="flex w-full max-w-[44em] flex-col items-start py-20 md:py-28">
    <Seo
      title="Sidan finns inte"
      description="Sidan du letar efter finns inte."
      path="/404"
      noindex
    />
    <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
      404
    </p>
    <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
      Sidan finns inte
    </h1>
    <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
      Länken kan vara gammal eller felstavad. Här är vägarna vidare — eller
      fråga i Slacken, där finns alltid någon som vet.
    </p>
    <ul className="mt-8 flex flex-wrap gap-3">
      <li>
        <Link
          href="/"
          className="inline-block rounded-full bg-brand-coral px-5 py-2 font-bold text-brand-grey"
        >
          Till startsidan
        </Link>
      </li>
      {NAV_TABS.map((tab) => (
        <li key={tab.hub}>
          <Link
            href={tab.hub}
            className="inline-block rounded-full border border-brand-cream/30 px-5 py-2 text-brand-cream/85 hover:border-brand-cream hover:text-brand-cream"
          >
            {tab.title}
          </Link>
        </li>
      ))}
    </ul>
  </section>
)

export default Custom404
