import Link from 'next/link'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const SaFungerarDet = () => {
  const meta = getRoute('/sa-fungerar-det')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Så fungerar det
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Så fungerar communityt
        </h1>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Ansökan
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Du ansöker med några rader om vad du gör och en länk till din
          LinkedIn. Communityt är för dig som redan är igång som frilansare —
          med ett bolag att fakturera genom och minst en kund. Blir du godkänd
          får du en Slack-inbjudan via mejl.
        </p>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          <Link href="/ansokan" className="underline hover:no-underline">
            Ansök om medlemskap
          </Link>
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Slacken
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Allt händer i Slack: kanaler för branscher, städer och ämnen, trådar
          med frågor och svar, och direktmeddelanden när du vill ta något
          vidare. Presentera dig i välkomstkanalen så hittar du snabbt rätt.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Uppdragen
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Medlemmar och företag tipsar om uppdrag i #uppdrag och i
          uppdragsportalen. Intresserad? Ta kontakt direkt med uppdragsgivaren —
          communityt tar ingen avgift och står aldrig som mellanhand.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 leading-[1.6] text-brand-cream/85">
          <Link href="/uppdrag" className="underline hover:no-underline">
            Se lediga uppdrag
          </Link>
          <Link href="/tipsa" className="underline hover:no-underline">
            Tipsa om ett uppdrag
          </Link>
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Reglerna
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Schysst ton, ingen spam, inga dolda säljintressen. Detaljerna finns i{' '}
          <Link href="/uppforandekod" className="underline hover:no-underline">
            uppförandekoden
          </Link>
          .
        </p>
      </section>
    </>
  )
}

export default SaFungerarDet
