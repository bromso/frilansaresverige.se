import type { FAQPage, WithContext } from 'schema-dts'
import FaqAccordion from '../components/Faq/FaqAccordion'
import { FAQ_ITEMS } from '../components/Faq/faq-items'
import Seo from '../components/Seo'
import StructuredData from '../components/StructuredData'
import { getRoute } from '../lib/routes'

const FragorOchSvar = () => {
  const meta = getRoute('/fragor-och-svar')!
  const jsonLd: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answerText },
    })),
  }

  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
          Frågor och svar
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Vanliga frågor om communityt
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Här är svaren på det vi oftast får frågor om. Hittar du inte ditt
          svar? Fråga i Slacken — eller mejla oss via kontaktsidan.
        </p>
        <div className="mt-10">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
      <StructuredData data={jsonLd} />
    </>
  )
}

export default FragorOchSvar
