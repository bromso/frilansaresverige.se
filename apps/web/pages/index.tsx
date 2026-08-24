import { Button } from '@frilansaresverige/ui/animate-ui/components/buttons/button'
import { Slide } from '@frilansaresverige/ui/animate-ui/primitives/effects/slide'
import { SlidingNumber } from '@frilansaresverige/ui/animate-ui/primitives/texts/sliding-number'
import { useReducedMotion } from '@frilansaresverige/ui/lib/use-reduced-motion'
import { Card } from '@frilansaresverige/ui/ui/card'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import type { ReactElement } from 'react'

const API_BASE_URL =
  process.env.API_BASE_URL || 'https://uppdrag.frilansaresverige.se/api'
const MEMBER_COUNT_API = `${API_BASE_URL}/member-count`
const FALLBACK_MEMBER_COUNT = 'flera tusen'
const FETCH_TIMEOUT_MS = 1000

export async function fetchMemberCount(): Promise<number | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(MEMBER_COUNT_API, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const count = parseInt((await response.text()).trim(), 10)
    return Number.isNaN(count) ? null : count
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

interface HomeProps {
  memberCount: number | null
}

const ArrowRight = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 13L17.17 13L11.59 18.59L13 20L21 12L13 4L11.59 5.41L17.17 11L3 11V13Z"
      fill="#333333"
    />
  </svg>
)

const MemberCount = ({ count }: { count: number | null }) => {
  const reduced = useReducedMotion()

  if (count === null) {
    return <>{FALLBACK_MEMBER_COUNT}</>
  }
  if (reduced) {
    return <>{count}</>
  }
  return <SlidingNumber number={count} />
}

// Wraps a card in the Slide entrance animation, except when the visitor has
// asked for reduced motion — in that case the card is rendered as-is, with
// no motion wrapper attached at all.
const CardSlide = ({
  reduced,
  children,
}: {
  reduced: boolean
  children: ReactElement
}) => (reduced ? children : <Slide asChild>{children}</Slide>)

const Home: NextPage<HomeProps> = ({ memberCount }) => {
  const reduced = useReducedMotion()

  return (
    <div className="flex w-full flex-col items-center">
      <Head>
        <title>Frilansare Sverige</title>
      </Head>

      <p className="mb-12 max-w-[45em] text-2xl leading-normal">
        Vi är Sveriges största community för frilansare med{' '}
        <MemberCount count={memberCount} /> medlemmar! Vårt syfte är att främja
        kontaktskapande och uppdragstipsande mellan frilansare.
      </p>

      <div className="flex w-full max-w-[65em] flex-wrap items-stretch justify-center gap-6">
        <CardSlide reduced={reduced}>
          <Card className="bg-brand-cream text-brand-blue rounded-[10px] p-6 text-left">
            <h2 className="mb-4 text-xl font-bold">Vi hjälper varandra</h2>
            <p className="text-xl leading-relaxed">
              Vi hjälper varandra med allt som rör livet som frilansare! T ex
              hur man hittar uppdrag och hur man bokför saker.
            </p>

            <h2 className="mb-4 text-xl font-bold">Ett Slack-community</h2>
            <p className="text-xl leading-relaxed">
              Frilansare från hela Sverige är välkomna.
            </p>

            <Button asChild variant="primary" size="none">
              <Link href="/ansokan">
                Ansök om medlemskap
                <ArrowRight />
              </Link>
            </Button>
          </Card>
        </CardSlide>

        <CardSlide reduced={reduced}>
          <Card className="bg-brand-cream text-brand-blue rounded-[10px] p-6 text-left">
            <h2 className="mb-4 text-xl font-bold">
              Vill du ha hjälp med något? &rarr;
            </h2>
            <p className="text-xl leading-relaxed">
              Om du jobbar på ett bolag som har konsultbehov så kan du gratis nå
              ut till <MemberCount count={memberCount} /> frilansare med
              informationen, utan mellanhänder.
            </p>

            <Button asChild variant="primary" size="none">
              <Link href="https://uppdrag.frilansaresverige.se/">
                Tipsa om konsultuppdrag
                <ArrowRight />
              </Link>
            </Button>
          </Card>
        </CardSlide>
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const memberCount = await fetchMemberCount()

  return {
    props: {
      memberCount,
    },
    revalidate: 3600,
  }
}

export default Home
