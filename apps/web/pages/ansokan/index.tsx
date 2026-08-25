import type { NextPage } from 'next'
import Link from 'next/link'
import FaqAccordion from '../../components/Faq/FaqAccordion'
import { FAQ_ITEMS } from '../../components/Faq/faq-items'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'
import RequestSlackInvitationForm from './RequestSlackInvitationForm'

const Ansokan: NextPage = () => {
  const meta = getRoute('/ansokan')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />

      <RequestSlackInvitationForm />
      <section
        aria-label="Vanliga frågor om medlemskapet"
        className="mx-auto mt-8 mb-16 w-full max-w-[44em]"
      >
        <h2 className="font-display mb-2 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Vanliga frågor
        </h2>
        <p className="font-display mb-6 text-2xl font-extrabold tracking-tight text-brand-cream md:text-3xl">
          Innan du ansöker
        </p>
        <FaqAccordion items={FAQ_ITEMS.slice(0, 3)} />
        <Link
          href="/fragor-och-svar"
          className="mt-4 inline-block underline hover:no-underline"
        >
          Fler frågor och svar
        </Link>
      </section>
    </>
  )
}

export default Ansokan
