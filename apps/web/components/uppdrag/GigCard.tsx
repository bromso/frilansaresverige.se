import Link from 'next/link'
import { formatPostDate, type GigMeta } from '../../lib/content'

// Job-board row: role eyebrow with the published date opposite, title,
// excerpt and meta chips. Deliberately artwork-free — the nyheter tiles
// carry covers and the event rows carry date badges; gigs are dense text.
const GigCard = ({ gig }: { gig: GigMeta }) => (
  <Link
    href={`/uppdrag/${gig.slug}`}
    className="flex flex-col gap-3 rounded-3xl bg-brand-cream/5 p-6 transition-colors hover:bg-brand-cream/10 sm:p-7"
  >
    <span className="flex items-baseline justify-between gap-4">
      <span className="font-display text-xs font-bold tracking-widest text-eyebrow uppercase">
        {gig.role}
      </span>
      <time dateTime={gig.date} className="text-sm text-brand-cream/60">
        {formatPostDate(gig.date)}
      </time>
    </span>
    <span className="font-display text-xl font-bold tracking-tight text-brand-cream sm:text-2xl">
      {gig.title}
    </span>
    <span className="max-w-[40em] leading-[1.6] text-brand-cream/75">
      {gig.excerpt}
    </span>
    <span className="mt-1 flex flex-wrap gap-2">
      {[gig.city, gig.scope, ...(gig.client ? [gig.client] : [])].map(
        (chip) => (
          <span
            key={chip}
            className="rounded-full bg-brand-cream/10 px-3 py-1 text-sm text-brand-cream/80"
          >
            {chip}
          </span>
        ),
      )}
    </span>
  </Link>
)

export default GigCard
