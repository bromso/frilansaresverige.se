import type { GetStaticProps } from 'next'
import Link from 'next/link'
import { useState } from 'react'
import Seo from '../../components/Seo'
import GigCard from '../../components/uppdrag/GigCard'
import { GIG_ROLES, type GigMeta, type GigRole } from '../../lib/content'
import { getAllGigs } from '../../lib/content.server'
import { getRoute } from '../../lib/routes'

interface Props {
  gigs: GigMeta[]
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { gigs: getAllGigs() },
})

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`font-display rounded-full px-4 py-2 text-sm font-bold transition-colors ${
      active
        ? 'bg-brand-coral text-brand-grey'
        : 'bg-brand-cream/10 text-brand-cream/80 hover:bg-brand-cream/15'
    }`}
  >
    {children}
  </button>
)

// Job-board take on the nyheter archive skeleton: heading + intro, a
// role-filter chip row, then dense listing rows instead of cover tiles.
const Uppdrag = ({ gigs }: Props) => {
  const meta = getRoute('/uppdrag')!
  const [role, setRole] = useState<GigRole | null>(null)
  const roles = GIG_ROLES.filter((r) => gigs.some((gig) => gig.role === r))
  const shown = role ? gigs.filter((gig) => gig.role === role) : gigs
  return (
    <>
      <Seo title={meta.title} description={meta.description} path="/uppdrag" />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <h1 className="font-display max-w-[16em] text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Lediga frilans- och konsultuppdrag
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Uppdragen kommer från medlemmar och företag som tipsar communityt
          direkt — inga mellanhänder, du tar kontakt med uppdragsgivaren själv.
          Har du ett uppdrag att dela?{' '}
          <Link href="/tipsa" className="underline hover:no-underline">
            Tipsa gratis
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <FilterChip active={role === null} onClick={() => setRole(null)}>
            Alla
          </FilterChip>
          {roles.map((r) => (
            <FilterChip key={r} active={role === r} onClick={() => setRole(r)}>
              {r}
            </FilterChip>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {shown.map((gig) => (
            <GigCard key={gig.slug} gig={gig} />
          ))}
        </div>

        <p className="mt-10 max-w-[36em] leading-[1.6] text-brand-cream/70">
          Är du inte medlem än?{' '}
          <Link href="/ansokan" className="underline hover:no-underline">
            Ansök om medlemskap
          </Link>{' '}
          så får du uppdragstipsen direkt i Slack.
        </p>
      </section>
    </>
  )
}

export default Uppdrag
