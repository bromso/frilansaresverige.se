import Link from 'next/link'
import {
  formatScore,
  REVIEW_CRITERIA,
  type ReviewMeta,
} from '../../lib/content'

// Review tile: company logo up front (initial-letter monogram until a
// review has a logo), a compact overall score opposite, and the three
// criteria as small labels with thin progress bars.
const ReviewCard = ({ review }: { review: ReviewMeta }) => (
  <Link
    href={`/recensioner/${review.slug}`}
    className="flex h-full flex-col gap-4 rounded-3xl bg-brand-cream/5 p-6 transition-colors hover:bg-brand-cream/10 sm:p-7"
  >
    <span className="flex items-center gap-4">
      {review.logo ? (
        <img
          alt=""
          src={review.logo}
          className="size-14 shrink-0 rounded-2xl"
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-display flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-cream/10 text-2xl font-extrabold text-brand-coral"
        >
          {review.title.charAt(0)}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-xs font-bold tracking-widest text-brand-coral uppercase">
          {review.category}
        </span>
        <span className="font-display mt-0.5 truncate text-xl font-bold tracking-tight text-brand-cream">
          {review.title}
        </span>
      </span>
      <span className="shrink-0 self-start text-sm text-brand-cream/60">
        <span className="font-display text-base font-bold text-brand-cream">
          {formatScore(review.overall)}
        </span>{' '}
        av 5
      </span>
    </span>

    <span className="leading-[1.6] text-brand-cream/75">{review.excerpt}</span>

    <span className="mt-auto flex flex-col gap-1.5">
      {REVIEW_CRITERIA.map(({ key, label }) => (
        <span key={key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-brand-cream/60">
            {label}
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-brand-cream/10">
            <span
              className="block h-full rounded-full bg-brand-coral"
              style={{ width: `${(review.scores[key] / 5) * 100}%` }}
            />
          </span>
          <span className="w-7 shrink-0 text-right text-xs text-brand-cream/70 tabular-nums">
            {formatScore(review.scores[key])}
          </span>
        </span>
      ))}
    </span>
  </Link>
)

export default ReviewCard
