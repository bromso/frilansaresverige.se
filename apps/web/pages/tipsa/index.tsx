import type { NextPage } from 'next'
import Link from 'next/link'
import FaqAccordion from '../../components/Faq/FaqAccordion'
import { TIPSA_FAQ_ITEMS } from '../../components/Faq/tipsa-faq-items'
import GigTipForm from '../../components/GigTipForm'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

const Tipsa: NextPage = () => {
  const meta = getRoute('/tipsa')!
  return (
    <div className="w-full max-w-[44em] pt-10 pb-24 md:pt-16">
      <Seo title={meta.title} description={meta.description} path={meta.path} />

      <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
        Konsultuppdrag
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
        Tipsa om ett uppdrag
      </h1>

      <p className="mt-4 mb-8 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
        Har du eller ditt företag ett konsultbehov? Beskriv uppdraget, så
        publicerar vi det för tusentals frilansare i Slack. Det är gratis, och
        de som är intresserade hör av sig direkt till dig. Tre korta steg.
      </p>

      <GigTipForm />

      <section
        aria-label="Vanliga frågor om uppdragstips"
        className="mt-16 w-full"
      >
        <h2 className="font-display mb-2 text-sm font-bold tracking-widest text-eyebrow uppercase">
          Vanliga frågor
        </h2>
        <p className="font-display mb-6 text-2xl font-extrabold tracking-tight text-brand-cream md:text-3xl">
          Bra att veta innan du tipsar
        </p>
        <FaqAccordion items={TIPSA_FAQ_ITEMS} />
        <Link
          href="/fragor-och-svar"
          className="mt-4 inline-block underline hover:no-underline"
        >
          Fler frågor och svar
        </Link>
      </section>
    </div>
  )
}

export default Tipsa
