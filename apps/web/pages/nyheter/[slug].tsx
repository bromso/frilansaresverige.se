import type { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { NewsArticle, WithContext } from 'schema-dts'
import type { LeafCrumb } from '../../components/Breadcrumbs'
import ArticleCard from '../../components/nyheter/ArticleCard'
import ArticleCover from '../../components/nyheter/ArticleCover'
import { MDX_COMPONENTS } from '../../components/nyheter/MdxContent'
import Seo, { SITE_NAME, SITE_URL } from '../../components/Seo'
import StructuredData from '../../components/StructuredData'
import { formatPostDate, type PostMeta } from '../../lib/content'
import { getAllPosts, getPost, getPostSlugs } from '../../lib/content.server'

interface Props {
  meta: PostMeta
  source: MDXRemoteSerializeResult
  more: PostMeta[]
  crumb: LeafCrumb
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getPostSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const { meta, content } = getPost(slug)
  const source = await serialize(content)
  const more = getAllPosts()
    .filter((post) => post.slug !== slug)
    .slice(0, 3)
  return {
    props: {
      meta,
      source,
      more,
      crumb: {
        section: '/nyheter',
        path: `/nyheter/${slug}`,
        label: meta.title,
      },
    },
  }
}

// Newsroom-style article: narrow centered column with category eyebrow,
// headline, the excerpt as standfirst, cover art and the MDX body.
const Artikel = ({ meta, source, more }: Props) => {
  const path = `/nyheter/${meta.slug}`
  const jsonLd: WithContext<NewsArticle> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.date,
    inLanguage: 'sv',
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}${path}`,
  }
  return (
    <>
      <Seo
        title={meta.title}
        description={meta.excerpt}
        path={path}
        type="article"
      />
      <StructuredData data={jsonLd} />
      <article className="w-full max-w-[42em] py-12 md:py-16">
        <div className="flex items-baseline gap-4">
          <p className="font-display text-sm font-bold tracking-widest text-brand-coral uppercase">
            {meta.category}
          </p>
          <time dateTime={meta.date} className="text-sm text-brand-cream/60">
            {formatPostDate(meta.date)}
          </time>
        </div>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-xl leading-[1.5] text-brand-cream/80">
          {meta.excerpt}
        </p>
        <div className="mt-8 aspect-[16/9] overflow-hidden rounded-3xl">
          <ArticleCover slug={meta.slug} image={meta.image} eager />
        </div>
        <div className="mt-2">
          <MDXRemote {...source} components={MDX_COMPONENTS} />
        </div>
      </article>
      {more.length > 0 && (
        <section
          aria-label="Fler nyheter"
          className="w-full max-w-[60em] pb-12 md:pb-16"
        >
          <h2 className="font-display text-2xl font-bold tracking-tight text-brand-cream md:text-3xl">
            Fler nyheter
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default Artikel
