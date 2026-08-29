import Link from 'next/link'
import { formatPostDate, formatScore, type ReviewMeta } from '../../lib/content'

// Review tile: a filled coral score badge (the section's signature, where
// nyheter has covers and event has date badges), category eyebrow,
// company name and the one-line verdict.
const ReviewCard = ({ review }: { review: ReviewMeta }) => (
  <Link
    href={`/recensioner/${review.slug}`}
    className="flex h-full gap-5 rounded-3xl bg-brand-cream/5 p-6 transition-colors hover:bg-brand-cream/10 sm:p-7"
  >
    <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-coral">
      <span className="sr-only">Betyg {formatScore(review.overall)} av 5</span>
      <span
        aria-hidden="true"
        className="font-display text-2xl font-extrabold text-brand-grey"
      >
        {formatScore(review.overall)}
      </span>
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="font-display text-xs font-bold tracking-widest text-brand-coral uppercase">
        {review.category}
      </span>
      <span className="font-display mt-1 text-xl font-bold tracking-tight text-brand-cream">
        {review.title}
      </span>
      <span className="mt-2 leading-[1.6] text-brand-cream/75">
        {review.excerpt}
      </span>
      <time dateTime={review.date} className="mt-3 text-sm text-brand-cream/60">
        {formatPostDate(review.date)}
      </time>
    </span>
  </Link>
)

export default ReviewCard
