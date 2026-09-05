import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import Link from 'next/link'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const Om = () => {
  const meta = getRoute('/om')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
          Om oss
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Om Frilansare Sverige
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          Frilansare Sverige är Sveriges största community för frilansare.
          Tusentals medlemmar i hela landet delar uppdrag, kunskap och vardag i
          Slack. Det är gratis, drivs ideellt och ingen mellanhand tjänar pengar
          på det.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Därför finns vi
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Att frilansa är friare än en anställning, men det kan också bli
          ensamt. Communityt ger det en arbetsplats annars ger: kollegor att
          bolla med, ett tips när någon annan är fullbokad och svar på frågorna
          som annars kostar dyra konsulttimmar. Vi är kollegor, inte
          konkurrenter.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Så drivs vi
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Allt görs av medlemmar på frivillig tid: moderering, träffar,
          rapporter och den här sajten. Det finns inga anställda och ingen
          medlemsavgift. En gång om året samlas vi till årsmöte och bestämmer
          vart vi ska härnäst, och alla medlemmar har en röst.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Öppen källkod
        </h2>
        <p className="mt-4 leading-[1.6] text-brand-cream/85">
          Sajten byggs av communityt och koden är öppen. Hittar du en bugg,
          eller vill du bygga något nytt? Bidra gärna på{' '}
          <a
            href="https://github.com/frilansaresverige/frilansaresverige.se/"
            className="underline hover:no-underline"
          >
            GitHub
          </a>
          .
        </p>
        <div className="mt-10">
          <Button asChild variant="primary" size="none">
            <Link href="/ansokan">Ansök om medlemskap</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

export default Om
