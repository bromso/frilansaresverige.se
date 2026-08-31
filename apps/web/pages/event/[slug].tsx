import type { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { Event as SchemaEvent, WithContext } from 'schema-dts'
import type { LeafCrumb } from '../../components/Breadcrumbs'
import { MDX_COMPONENTS } from '../../components/nyheter/MdxContent'
import Seo, { SITE_NAME, SITE_URL } from '../../components/Seo'
import StructuredData from '../../components/StructuredData'
import {
  type EventMeta,
  formatEventDate,
  formatEventTime,
  parseLocalDate,
} from '../../lib/content'
import { getEvent, getEventSlugs } from '../../lib/content.server'

interface Props {
  meta: EventMeta
  source: MDXRemoteSerializeResult
  /** Computed at build time, like the archive's upcoming/past split. */
  isPast: boolean
  crumb: LeafCrumb
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getEventSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const { meta, content } = getEvent(slug)
  const source = await serialize(content)
  const isPast = parseLocalDate(meta.endDate ?? meta.startDate) < new Date()
  return {
    props: {
      meta,
      source,
      isPast,
      crumb: { section: '/event', path: `/event/${slug}`, label: meta.title },
    },
  }
}

const InfoRow = ({ icon, children }: { icon: string; children: string }) => (
  <div className="flex items-center gap-3">
    <span
      aria-hidden="true"
      className={`${icon} size-5 shrink-0 text-brand-coral`}
    />
    <span className="text-brand-cream/85">{children}</span>
  </div>
)

const EnskiltEvent = ({ meta, source, isPast }: Props) => {
  const path = `/event/${meta.slug}`
  const online = meta.city === 'Online'
  const jsonLd: WithContext<SchemaEvent> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: meta.title,
    description: meta.excerpt,
    startDate: meta.startDate,
    ...(meta.endDate && { endDate: meta.endDate }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', name: meta.location }
      : {
          '@type': 'Place',
          name: meta.location,
          address: {
            '@type': 'PostalAddress',
            addressLocality: meta.city,
            addressCountry: 'SE',
          },
        },
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    ...(meta.rsvpUrl && {
      offers: {
        '@type': 'Offer',
        url: meta.rsvpUrl,
        price: meta.price === 'Gratis' ? '0' : (meta.price ?? '0'),
        priceCurrency: 'SEK',
        availability: 'https://schema.org/InStock',
      },
    }),
  }
  return (
    <>
      <Seo title={meta.title} description={meta.excerpt} path={path} />
      <StructuredData data={jsonLd} />
      <article className="w-full max-w-[42em] py-12 md:py-16">
        <p className="font-display text-sm font-bold tracking-widest text-eyebrow uppercase">
          Event
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-xl leading-[1.5] text-brand-cream/80">
          {meta.excerpt}
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-brand-cream/5 p-7">
          <InfoRow icon="icon-[lucide--calendar]">
            {formatEventDate(meta.startDate)}
          </InfoRow>
          <InfoRow icon="icon-[lucide--clock]">
            {formatEventTime(meta.startDate, meta.endDate)}
          </InfoRow>
          <InfoRow icon="icon-[lucide--map-pin]">
            {online ? meta.location : `${meta.location}, ${meta.city}`}
          </InfoRow>
          {meta.price && (
            <InfoRow icon="icon-[lucide--ticket]">{meta.price}</InfoRow>
          )}
          {isPast ? (
            <p className="mt-2 text-brand-cream/60">
              Det här eventet har ägt rum.
            </p>
          ) : (
            meta.rsvpUrl && (
              <a
                href={meta.rsvpUrl}
                className="font-display mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand-coral px-6 py-3 font-bold text-brand-grey transition-transform hover:scale-[1.03]"
              >
                Anmäl dig
                <span
                  aria-hidden="true"
                  className="icon-[lucide--arrow-right] size-4"
                />
              </a>
            )
          )}
        </div>

        <div className="mt-2">
          <MDXRemote {...source} components={MDX_COMPONENTS} />
        </div>
      </article>
    </>
  )
}

export default EnskiltEvent
