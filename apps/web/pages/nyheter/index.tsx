import type { GetStaticProps } from 'next'
import ArticleCard from '../../components/nyheter/ArticleCard'
import Seo from '../../components/Seo'
import { getAllPosts, type PostMeta } from '../../lib/content'
import { getRoute } from '../../lib/routes'

interface Props {
  posts: PostMeta[]
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { posts: getAllPosts() },
})

// Newsroom-style archive: the latest post as a full-width featured card,
// the rest in a tile grid.
const Nyheter = ({ posts }: Props) => {
  const meta = getRoute('/nyheter')!
  const [featured, ...rest] = posts
  return (
    <>
      <Seo title={meta.title} description={meta.description} path="/nyheter" />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          Nyheter
        </h1>
        <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          Det senaste från communityt, sajten och frilanslivet i Sverige.
        </p>
        {featured && (
          <div className="mt-10">
            <ArticleCard post={featured} featured />
          </div>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  )
}

export default Nyheter
