import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import Link from 'next/link'
import Seo from '../components/Seo'
import { getRoute } from '../lib/routes'

const AnlitaFrilansare = () => {
  const meta = getRoute('/anlita-frilansare')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />
      <section className="flex w-full max-w-[44em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          För företag
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Anlita en frilansare ur communityt
        </h1>
        <p className="mt-4 text-lg leading-[1.6] text-brand-cream/85">
          I Frilansare Sverige finns frilansare i hela landet och i de flesta
          branscher: utveckling, design, copy, foto, projektledning, ekonomi och
          mer. Alla är etablerade — med eget bolag och minst en kund bakom sig.
        </p>
        <h2 className="font-display mt-10 text-2xl font-bold text-brand-cream">
          Så går det till
        </h2>
        <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 leading-[1.6] text-brand-cream/85">
          <li>
            <Link href="/tipsa" className="underline hover:no-underline">
              Tipsa om uppdraget
            </Link>{' '}
            — beskriv behovet, platsen och arvodet.
          </li>
          <li>
            Tipset publiceras till communityts tusentals medlemmar direkt i
            Slack.
          </li>
          <li>
            Intresserade frilansare kontaktar dig direkt. Ni gör upp om
            villkoren själva — vi tar ingen avgift och står inte som mellanhand.
          </li>
        </ol>
        <div className="mt-10">
          <Button asChild variant="primary" size="none">
            <Link href="/tipsa">Tipsa om ditt uppdrag</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

export default AnlitaFrilansare
