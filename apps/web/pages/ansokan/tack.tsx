import Link from 'next/link'
import { useEffect } from 'react'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'

const AnsokanTack = () => {
  const meta = getRoute('/ansokan/tack')!

  // The form redirects here client-side, so _document's gtag config (which
  // only fires on a full document load) never records this pageview.
  // Report it ourselves, as a no-op when gtag hasn't loaded.
  useEffect(() => {
    window.gtag?.('event', 'page_view', { page_path: '/ansokan/tack' })
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
          Ansökan inskickad
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Tack för din ansökan
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Din ansökan är inskickad. En av oss tittar på den, oftast inom några
          dagar, och sedan kommer din inbjudan till Slacken via mejl. Håll koll
          på skräpposten för säkerhets skull.
        </p>
        <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/70">
          Medan du väntar kan du läsa{' '}
          <Link
            href="/sa-fungerar-det"
            className="underline hover:no-underline"
          >
            hur communityt fungerar
          </Link>{' '}
          eller kika på{' '}
          <Link
            href="/fragor-och-svar"
            className="underline hover:no-underline"
          >
            vanliga frågor
          </Link>
          .
        </p>
      </section>
    </>
  )
}

export default AnsokanTack
