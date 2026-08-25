import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Uppforandekod = () => {
  const meta = getRoute('/uppforandekod')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Community
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Uppförandekod
        </h1>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Var schysst
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Vi är kollegor, inte konkurrenter. Hård kritik mot idéer är okej;
          påhopp på personer är det inte. Trakasserier och diskriminering leder
          till uteslutning.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Ingen spam
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Dela gärna det du gör, men communityt är inte en säljkanal.
          Massutskick, oombedd reklam och dolda affärsintressen hör inte hemma
          här.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Uppdragstips är gratis och direkta
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Tipsa bara om uppdrag du själv står bakom, med ärliga villkor och en
          riktig kontaktperson. Inga mellanhänder som säljer vidare communityts
          tips.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Säg till
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Ser du något som bryter mot koden? Säg till en administratör i
          Slacken.
        </p>
      </section>
    </>
  )
}

export default Uppforandekod
