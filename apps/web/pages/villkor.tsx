import Link from 'next/link'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Villkor = () => {
  const meta = getRoute('/villkor')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Juridik
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Villkor
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          Villkor för medlemskap och användning av Frilansare Sveriges community
          och sajt.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Medlemskap
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Medlemskap i communityt är gratis och till för dig som redan är igång
          som aktiv frilansare. Medlemskapet kan avslutas om du bryter mot vår{' '}
          <Link href="/uppforandekod" className="underline hover:no-underline">
            uppförandekod
          </Link>
          .
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Uppdragstips
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Uppdragstips publiceras till communityt som de skickas in. Communityt
          är ingen part i avtal mellan frilansare och uppdragsgivare, och tar
          inget ansvar för uppdragens innehåll eller riktighet.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Sajten
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Sajten tillhandahålls i befintligt skick. Koden är öppen källkod och
          finns på{' '}
          <a
            href="https://github.com/frilansaresverige/frilansaresverige.se/"
            className="underline hover:no-underline"
          >
            GitHub
          </a>
          .
        </p>

        <p className="mt-10 text-sm text-brand-cream/60">
          Senast uppdaterad: 2026-08-25
        </p>
      </section>
    </>
  )
}

export default Villkor
