import Link from 'next/link'
import { formatPostDate, type PostMeta } from '../../lib/content'
import ArticleCover from './ArticleCover'

// Newsroom-style tile: cover flush to the top, category eyebrow, title
// and date below. `featured` blows the newest post up to a full-width
// card with its excerpt as a standfirst.
const ArticleCard = ({
  post,
  featured = false,
}: {
  post: PostMeta
  featured?: boolean
}) => (
  <Link
    href={`/nyheter/${post.slug}`}
    className="group flex h-full flex-col overflow-hidden rounded-3xl bg-brand-cream/5 transition-colors hover:bg-brand-cream/10"
  >
    <div
      className={featured ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-[16/10]'}
    >
      <ArticleCover slug={post.slug} image={post.image} eager={featured} />
    </div>
    <div
      className={featured ? 'flex flex-col p-7 md:p-9' : 'flex flex-col p-6'}
    >
      <p className="font-display text-xs font-bold tracking-widest text-brand-coral uppercase">
        {post.category}
      </p>
      <h3
        className={`font-display mt-2 font-bold tracking-tight text-brand-cream ${
          featured ? 'text-2xl md:text-4xl' : 'text-xl'
        }`}
      >
        {post.title}
      </h3>
      {featured && (
        <p className="mt-3 max-w-[36em] text-lg leading-[1.6] text-brand-cream/80">
          {post.excerpt}
        </p>
      )}
      <time dateTime={post.date} className="mt-3 text-sm text-brand-cream/60">
        {formatPostDate(post.date)}
      </time>
    </div>
  </Link>
)

export default ArticleCard
