import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Cookies = () => {
  const meta = getRoute('/cookies')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Juridik
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Cookies och lokal lagring
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          Så använder frilansaresverige.se cookies och lagring i din webbläsare.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Så använder vi lagring i webbläsaren
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Ditt val av ljust eller mörkt tema sparas lokalt i din webbläsare
          (local storage), så att sajten kommer ihåg valet nästa gång du besöker
          den.
        </p>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Svarar du ja eller nej i cookie-rutan som visas första gången du
          besöker sajten, sparas det svaret i en förstapartscookie i ett år, så
          att rutan inte visas igen.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Google Analytics
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Sajten läser in Google Analytics för att föra besöksstatistik, till
          exempel hur många som besöker en sida. Skriptet läses in när sidan
          laddas och kan sätta cookies eller liknande identifierare i din
          webbläsare för att räkna besök, oavsett vilket svar du ger i
          cookie-rutan.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Tredjepartscookies
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Google Analytics, som beskrivs ovan, är den enda tredjepartstjänst
          sajten använder. Utöver det sätter sajten inga tredjepartscookies.
        </p>

        <p className="mt-10 text-sm text-brand-cream/60">
          Senast uppdaterad: 2026-08-25
        </p>
      </section>
    </>
  )
}

export default Cookies
