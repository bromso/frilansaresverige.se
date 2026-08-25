import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Om = () => {
  const meta = getRoute('/om')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <Breadcrumbs path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Om oss
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Om Frilansare Sverige
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          Frilansare Sverige är Sveriges största community för frilansare. Vi
          främjar kontaktskapande och uppdragstipsande mellan frilansare — helt
          gratis, utan mellanhänder.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Därför finns vi
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Att frilansa är friare än en anställning — men också ensammare.
          Communityt ger det en arbetsplats annars ger: kollegor att bolla med,
          tips när någon är fullbokad och svar på frågorna som annars kostar
          dyra konsulttimmar.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Öppen källkod
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Sajten byggs av communityt och koden är öppen. Bidra gärna på{' '}
          <a
            href="https://github.com/frilansaresverige/frilansaresverige.se/"
            className="underline hover:no-underline"
          >
            GitHub
          </a>
          !
        </p>
        <div className="mt-10">
          <Link
            href="/ansokan"
            className="inline-block rounded-full bg-brand-coral px-6 py-3 font-bold text-brand-grey"
          >
            Ansök om medlemskap
          </Link>
        </div>
      </section>
    </>
  )
}

export default Om
