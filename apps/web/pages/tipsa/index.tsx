import type { NextPage } from 'next'
import GigTipForm from '../../components/GigTipForm'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

const Tipsa: NextPage = () => {
  const meta = getRoute('/tipsa')!
  return (
    <div className="w-full max-w-[44em] pt-10 pb-24 md:pt-16">
      <Seo title={meta.title} description={meta.description} path={meta.path} />

      <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
        Konsultuppdrag
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
        Tipsa om ett uppdrag
      </h1>

      <p className="mt-4 mb-8 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
        Har du eller ditt företag ett konsultbehov? Publicera uppdraget direkt
        till våra medlemmar — gratis, utan mellanhänder och direkt från källan.
      </p>

      <GigTipForm />
    </div>
  )
}

export default Tipsa
