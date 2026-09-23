import Link from 'next/link'
import { useEffect } from 'react'
import Seo from '../../components/Seo'
import { requireRoute } from '../../lib/routes'

const TipsaTack = () => {
  const meta = requireRoute('/tipsa/tack')

  // The form redirects here client-side, so _document's gtag config (which
  // only fires on a full document load) never records this pageview.
  // Report it ourselves, as a no-op when gtag hasn't loaded.
  useEffect(() => {
    window.gtag?.('event', 'page_view', { page_path: '/tipsa/tack' })
  }, [])

  return (
    <>
      <Seo
        title={meta.title}
        description={meta.description}
        path={meta.path}
        noindex
      />
      <section className="flex w-full max-w-[44em] flex-col items-start py-16 md:py-24">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
          Uppdrag publicerat
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Tack, uppdraget är publicerat
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Uppdraget ligger nu i uppdragskanalen i Slack. En kvittens med en länk
          för att komplettera eller ta bort uppdraget är på väg till
          e-postadressen du angav. Frilansare som är intresserade hör av sig
          direkt till kontaktpersonen. Vi står inte emellan.
        </p>
        <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/75">
          Har du fler uppdrag?{' '}
          <Link href="/tipsa" className="underline hover:no-underline">
            Publicera ett till
          </Link>
          .
        </p>
      </section>
    </>
  )
}

export default TipsaTack
