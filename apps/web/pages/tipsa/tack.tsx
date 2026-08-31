import Link from 'next/link'
import { useEffect } from 'react'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

const TipsaTack = () => {
  const meta = getRoute('/tipsa/tack')!

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
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          Tips inskickat
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Tack för tipset
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Uppdraget är inskickat till communityt. Frilansare som är intresserade
          hör av sig direkt till kontaktpersonen du angav — utan mellanhänder.
        </p>
        <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/70">
          Har du fler uppdrag?{' '}
          <Link href="/tipsa" className="underline hover:no-underline">
            Tipsa igen
          </Link>
          .
        </p>
      </section>
    </>
  )
}

export default TipsaTack
