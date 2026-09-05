import type { GetStaticProps } from 'next'
import EventCard from '../../components/event/EventCard'
import ItemListJsonLd from '../../components/ItemListJsonLd'
import Seo from '../../components/Seo'
import { type EventMeta, splitEvents } from '../../lib/content'
import { getAllEvents } from '../../lib/content.server'
import { getRoute } from '../../lib/routes'

interface Props {
  upcoming: EventMeta[]
  past: EventMeta[]
}

// The upcoming/past split happens at build time, so it refreshes on the
// next deploy — fine for a static site where events are added (and
// thereby rebuilt) well before they happen.
export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: splitEvents(getAllEvents(), new Date()),
})

const Event = ({ upcoming, past }: Props) => {
  const meta = getRoute('/event')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path="/event" />
      <ItemListJsonLd
        name="Event från Frilansare Sverige"
        items={[...upcoming, ...past].map((event) => ({
          path: `/event/${event.slug}`,
          name: event.title,
        }))}
      />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Event
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          AW:er, workshops och årsmöten. Träffarna är gratis, öppna för alla
          medlemmar och det enklaste sättet att sätta ansikten på
          Slack-avatarerna.
        </p>

        <h2 className="font-display mt-10 text-2xl font-bold tracking-tight text-brand-cream">
          Kommande event
        </h2>
        {upcoming.length > 0 ? (
          <div className="mt-5 flex flex-col gap-4">
            {upcoming.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-4 max-w-[36em] leading-[1.6] text-brand-cream/70">
            Inga inplanerade event just nu. Håll utkik i Slacken, det brukar
            inte dröja länge. Vill du dra igång en träff på din ort? Säg till i
            #meta.
          </p>
        )}

        {past.length > 0 && (
          <>
            <h2 className="font-display mt-12 text-2xl font-bold tracking-tight text-brand-cream">
              Tidigare event
            </h2>
            <div className="mt-5 flex flex-col gap-4">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} past />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}

export default Event
