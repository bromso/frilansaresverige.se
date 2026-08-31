import type { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { JobPosting, WithContext } from 'schema-dts'
import type { LeafCrumb } from '../../components/Breadcrumbs'
import { MDX_COMPONENTS } from '../../components/nyheter/MdxContent'
import Seo, { SITE_NAME, SITE_URL } from '../../components/Seo'
import StructuredData from '../../components/StructuredData'
import { formatPostDate, type GigMeta } from '../../lib/content'
import { getGig, getGigSlugs } from '../../lib/content.server'

interface Props {
  meta: GigMeta
  source: MDXRemoteSerializeResult
  crumb: LeafCrumb
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getGigSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const { meta, content } = getGig(slug)
  const source = await serialize(content)
  return {
    props: {
      meta,
      source,
      crumb: {
        section: '/uppdrag',
        path: `/uppdrag/${slug}`,
        label: meta.title,
      },
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

const EnskiltUppdrag = ({ meta, source }: Props) => {
  const path = `/uppdrag/${meta.slug}`
  const remote = meta.city === 'Distans'
  const jsonLd: WithContext<JobPosting> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: meta.title,
    description: meta.excerpt,
    datePosted: meta.date,
    employmentType: 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: meta.client ?? SITE_NAME,
    },
    ...(remote
      ? { jobLocationType: 'TELECOMMUTE' }
      : {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: meta.city,
              addressCountry: 'SE',
            },
          },
        }),
    ...(meta.applyUrl && { directApply: true }),
    url: `${SITE_URL}${path}`,
  }
  return (
    <>
      <Seo title={meta.title} description={meta.excerpt} path={path} />
      <StructuredData data={jsonLd} />
      <article className="w-full max-w-[42em] py-12 md:py-16">
        <p className="font-display text-sm font-bold tracking-widest text-eyebrow uppercase">
          {meta.role}
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-xl leading-[1.5] text-brand-cream/80">
          {meta.excerpt}
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-brand-cream/5 p-7">
          <InfoRow icon="icon-[lucide--map-pin]">{meta.city}</InfoRow>
          <InfoRow icon="icon-[lucide--briefcase-business]">
            {meta.scope}
          </InfoRow>
          {meta.client && (
            <InfoRow icon="icon-[lucide--building-2]">{meta.client}</InfoRow>
          )}
          <InfoRow icon="icon-[lucide--calendar]">
            {`Publicerat ${formatPostDate(meta.date)}`}
          </InfoRow>
          {meta.applyUrl ? (
            <a
              href={meta.applyUrl}
              className="font-display mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand-coral px-6 py-3 font-bold text-brand-grey transition-transform hover:scale-[1.03]"
            >
              Kontakta uppdragsgivaren
              <span
                aria-hidden="true"
                className="icon-[lucide--arrow-right] size-4"
              />
            </a>
          ) : (
            <p className="mt-2 leading-[1.6] text-brand-cream/70">
              Uppdraget söks via communityt — som medlem hittar du kontaktvägen
              i uppdragskanalen i Slack.{' '}
              <Link href="/ansokan" className="underline hover:no-underline">
                Bli medlem
              </Link>
              .
            </p>
          )}
        </div>

        <div className="mt-2">
          <MDXRemote {...source} components={MDX_COMPONENTS} />
        </div>
      </article>
    </>
  )
}

export default EnskiltUppdrag
