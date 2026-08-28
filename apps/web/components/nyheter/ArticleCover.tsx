// Cover art for posts and events. Until a piece has real imagery (the
// `image` frontmatter field), it gets one of a few curated brand
// gradients, picked deterministically from the slug so archives vary
// without shipping binary assets. Colors are the fixed brand hex values
// (not theme tokens) — the covers are artwork and keep their look in
// both themes.
const GRADIENTS = [
  'radial-gradient(120% 160% at 85% 15%, #ffcfc8 0%, #ff9c8e 30%, #4823dc 75%)',
  'radial-gradient(140% 140% at 15% 85%, #ff9c8e 0%, #2601bb 60%, #4823dc 100%)',
  'linear-gradient(135deg, #2601bb 0%, #4823dc 45%, #ff9c8e 100%)',
  'radial-gradient(100% 180% at 50% 110%, #fffce3 0%, #ffcfc8 25%, #4823dc 70%)',
  'radial-gradient(150% 120% at 90% 90%, #ffcfc8 0%, #4823dc 55%, #2601bb 100%)',
]

const hash = (value: string): number => {
  let h = 0
  for (const char of value) {
    h = (h * 31 + (char.codePointAt(0) ?? 0)) % 997
  }
  return h
}

const ArticleCover = ({ slug, image }: { slug: string; image?: string }) =>
  image ? (
    // Covers are decorative — the adjacent heading carries the meaning.
    <img alt="" src={image} className="size-full object-cover" />
  ) : (
    <div
      aria-hidden="true"
      className="size-full"
      style={{ background: GRADIENTS[hash(slug) % GRADIENTS.length] }}
    />
  )

export default ArticleCover
