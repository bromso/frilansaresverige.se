import Link from 'next/link'
import {
  type EventMeta,
  formatEventBadge,
  formatEventTime,
} from '../../lib/content'

// List row with a calendar-tile date badge. Past events are dimmed but
// still clickable — the write-ups keep their value as history.
const EventCard = ({
  event,
  past = false,
}: {
  event: EventMeta
  past?: boolean
}) => {
  const badge = formatEventBadge(event.startDate)
  return (
    <Link
      href={`/event/${event.slug}`}
      className={`flex items-center gap-5 rounded-3xl bg-brand-cream/5 p-5 transition-colors hover:bg-brand-cream/10 sm:p-6 ${
        past ? 'opacity-70 hover:opacity-100' : ''
      }`}
    >
      <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-cream/10">
        <span className="font-display text-2xl leading-none font-extrabold text-brand-cream">
          {badge.day}
        </span>
        <span className="font-display mt-0.5 text-xs font-bold tracking-widest text-brand-coral uppercase">
          {badge.month}
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-lg font-bold tracking-tight text-brand-cream sm:text-xl">
          {event.title}
        </span>
        <span className="mt-1 text-sm text-brand-cream/70">
          {event.city} · {formatEventTime(event.startDate, event.endDate)} ·{' '}
          {event.location}
        </span>
      </span>
    </Link>
  )
}

export default EventCard
