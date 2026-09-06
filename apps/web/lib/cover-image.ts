import { getImageProps } from 'next/image'

// The nyheter covers ship as 1600px JPEGs (120–385 KB each) and are shown
// at anything from a 300px tile to a 960px hero. Rather than serve the
// original to every viewport, run them through Next's image optimizer —
// the same loader next/image uses, minus the component, since the cover
// art lives in the framework-free ui package. The result is a `src`,
// `srcSet` and `sizes` triple for a plain <img>: the optimizer picks a
// width per device from `sizes` and encodes AVIF/WebP on the fly.
//
// Call this from getStaticProps only: `getImageProps` pulls next/image's
// client code into any component that calls it during render, and the
// triple is plain JSON, so it is computed at build time and handed to
// the components as props.

/** Featured card: the full 60em column, or the viewport below it. */
export const COVER_SIZES_FEATURED = '(min-width: 64em) 60em, 100vw'
/** Article hero: the 42em reading column. */
export const COVER_SIZES_ARTICLE = '(min-width: 46em) 42em, 100vw'
/** Grid tile: a third of the column on desktop, half on tablets. */
export const COVER_SIZES_TILE =
  '(min-width: 64em) 20em, (min-width: 40em) 50vw, 100vw'

export interface CoverImageProps {
  src: string
  srcSet?: string
  sizes?: string
}

export const coverImageProps = (
  image: string,
  sizes: string,
): CoverImageProps => {
  const {
    props: { src, srcSet },
  } = getImageProps({
    src: image,
    alt: '',
    fill: true,
    sizes,
    quality: 75,
  })
  // Leave `srcSet` out rather than `undefined`: getStaticProps props
  // must be JSON-serialisable.
  return { src, sizes, ...(srcSet && { srcSet }) }
}

/** A post with its cover resolved at build time (`null` when it has none). */
export type WithCover<T extends { image?: string }> = T & {
  cover: CoverImageProps | null
}

export const withCover = <T extends { image?: string }>(
  post: T,
  sizes: string,
): WithCover<T> => ({
  ...post,
  cover: post.image ? coverImageProps(post.image, sizes) : null,
})
