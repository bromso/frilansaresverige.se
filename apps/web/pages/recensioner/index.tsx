import type { GetStaticProps } from 'next'
import { useState } from 'react'
import FilterChip from '../../components/FilterChip'
import ItemListJsonLd from '../../components/ItemListJsonLd'
import ReviewCard from '../../components/recensioner/ReviewCard'
import Seo from '../../components/Seo'
import {
  REVIEW_CATEGORIES,
  type ReviewCategory,
  type ReviewMeta,
} from '../../lib/content'
import { getAllReviews } from '../../lib/content.server'
import { getRoute } from '../../lib/routes'

interface Props {
  reviews: ReviewMeta[]
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { reviews: getAllReviews() },
})

// Ranked review directory: category chips like /uppdrag, but a two-column
// card grid led by score badges, sorted best first.
const Recensioner = ({ reviews }: Props) => {
  const meta = getRoute('/recensioner')!
  const [category, setCategory] = useState<ReviewCategory | null>(null)
  const categories = REVIEW_CATEGORIES.filter((c) =>
    reviews.some((review) => review.category === c),
  )
  const shown = category
    ? reviews.filter((review) => review.category === category)
    : reviews
  return (
    <>
      <Seo
        title={meta.title}
        description={meta.description}
        path="/recensioner"
      />
      <ItemListJsonLd
        name="Recensioner av konsultmäklare och rekryterare"
        items={reviews.map((review) => ({
          path: `/recensioner/${review.slug}`,
          name: review.title,
        }))}
      />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <h1 className="font-display max-w-[16em] text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Recensioner av konsultmäklare och rekryterare
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Så upplever communityts medlemmar bolagen som förmedlar uppdrag och
          rekryterar frilansare — villkor, transparens och bemötande, utan
          filter. Har du en egen erfarenhet? Dela den i Slacken.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <FilterChip
            active={category === null}
            onClick={() => setCategory(null)}
          >
            Alla
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </FilterChip>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {shown.map((review) => (
            <ReviewCard key={review.slug} review={review} />
          ))}
        </div>

        <p className="mt-10 max-w-[36em] text-sm leading-[1.6] text-brand-cream/60">
          Recensionerna bygger på erfarenheter från medlemmar i Frilansare
          Sverige och uppdateras när nya erfarenheter kommer in. Betygen är
          communityts samlade bild, inte en vetenskaplig mätning.
        </p>
      </section>
    </>
  )
}

export default Recensioner
