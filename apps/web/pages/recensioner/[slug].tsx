import type { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { Review, WithContext } from 'schema-dts'
import type { LeafCrumb } from '../../components/Breadcrumbs'
import { MDX_COMPONENTS } from '../../components/nyheter/MdxContent'
import Seo, { SITE_NAME, SITE_URL } from '../../components/Seo'
import StructuredData from '../../components/StructuredData'
import {
  formatPostDate,
  formatScore,
  REVIEW_CRITERIA,
  type ReviewMeta,
} from '../../lib/content'
import { getReview, getReviewSlugs } from '../../lib/content.server'

interface Props {
  meta: ReviewMeta
  source: MDXRemoteSerializeResult
  crumb: LeafCrumb
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getReviewSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const { meta, content } = getReview(slug)
  const source = await serialize(content)
  return {
    props: {
      meta,
      source,
      crumb: {
        section: '/recensioner',
        path: `/recensioner/${slug}`,
        label: meta.title,
      },
    },
  }
}

const ScoreRow = ({ label, score }: { label: string; score: number }) => (
  <div className="flex items-center gap-4">
    <span className="w-28 shrink-0 text-brand-cream/85">{label}</span>
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-cream/10">
      <div
        className="h-full rounded-full bg-brand-coral"
        style={{ width: `${(score / 5) * 100}%` }}
      />
    </div>
    <span className="w-8 shrink-0 text-right font-semibold text-brand-cream tabular-nums">
      {formatScore(score)}
    </span>
  </div>
)

const EnskildRecension = ({ meta, source }: Props) => {
  const path = `/recensioner/${meta.slug}`
  const jsonLd: WithContext<Review> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Organization',
      name: meta.title,
      ...(meta.website && { url: meta.website }),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: meta.overall,
      bestRating: 5,
      worstRating: 1,
    },
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    datePublished: meta.date,
    reviewBody: meta.excerpt,
    inLanguage: 'sv',
  }
  return (
    <>
      <Seo
        title={`Recension: ${meta.title}`}
        description={meta.excerpt}
        path={path}
      />
      <StructuredData data={jsonLd} />
      <article className="w-full max-w-[42em] py-12 md:py-16">
        <p className="font-display text-sm font-bold tracking-widest text-eyebrow uppercase">
          {meta.category}
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-xl leading-[1.5] text-brand-cream/80">
          {meta.excerpt}
        </p>

        <div className="mt-8 flex flex-col gap-5 rounded-3xl bg-brand-cream/5 p-7">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-extrabold text-brand-cream">
              {formatScore(meta.overall)}
            </span>
            <span className="text-brand-cream/60">av 5</span>
          </div>
          <div className="flex flex-col gap-3">
            {REVIEW_CRITERIA.map(({ key, label }) => (
              <ScoreRow key={key} label={label} score={meta.scores[key]} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-cream/60">
            <span>Publicerad {formatPostDate(meta.date)}</span>
            {meta.website && (
              <a
                href={meta.website}
                className="underline hover:no-underline"
                rel="nofollow"
              >
                Bolagets webbplats
              </a>
            )}
          </div>
          <p className="text-sm leading-[1.6] text-brand-cream/60 italic">
            Recensionen bygger på erfarenheter från medlemmar i communityt och
            uppdateras när nya erfarenheter kommer in.
          </p>
        </div>

        <div className="mt-2">
          <MDXRemote {...source} components={MDX_COMPONENTS} />
        </div>
      </article>
    </>
  )
}

export default EnskildRecension
