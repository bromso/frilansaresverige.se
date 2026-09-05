import Link from 'next/link'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Kontakt = () => {
  const meta = getRoute('/kontakt')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
          Kontakt
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Hör av dig
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          Är du medlem får du snabbast svar i Slacken. Annars når du oss så här:
        </p>
        <ul className="mt-6 flex list-disc flex-col gap-3 pl-5 leading-[1.6] text-brand-cream/85">
          <li>
            Frågor om medlemskap och ansökan: kika först i{' '}
            <Link
              href="/fragor-och-svar"
              className="underline hover:no-underline"
            >
              frågor och svar
            </Link>
            , där finns svaren på det vanligaste.
          </li>
          <li>
            Uppdrag och konsultbehov:{' '}
            <Link href="/tipsa" className="underline hover:no-underline">
              tipsa om ditt uppdrag
            </Link>
            , så når det communityt direkt.
          </li>
          <li>
            Press, samarbeten, buggar och övrigt: öppna ett ärende på{' '}
            <a
              href="https://github.com/frilansaresverige/frilansaresverige.se/"
              className="underline hover:no-underline"
            >
              GitHub
            </a>
            , så ser någon av oss det.
          </li>
        </ul>
        <p className="mt-6 max-w-[36em] leading-[1.6] text-brand-cream/70">
          Vi är ett ideellt community utan anställda, så det kan dröja någon dag
          innan du får svar. Men du får svar.
        </p>
      </section>
    </>
  )
}

export default Kontakt
