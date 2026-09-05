import Head from 'next/head'
import type { CoverImageProps } from '../../lib/cover-image'

// Preload for an above-the-fold cover (the featured card, the article
// hero): the <img> sits deep in the body, so on a slow connection the
// browser only discovers it once that part of the HTML has streamed in —
// a link in <head> starts the download with the first bytes. Same tag
// next/image emits for `priority`, hand-rolled because the cover art is
// a plain <img> from the ui package.
const CoverPreload = ({ src, srcSet, sizes }: CoverImageProps) => (
  <Head>
    <link
      key={`cover-preload-${src}`}
      rel="preload"
      as="image"
      href={srcSet ? undefined : src}
      imageSrcSet={srcSet}
      imageSizes={srcSet ? sizes : undefined}
      fetchPriority="high"
    />
  </Head>
)

export default CoverPreload
