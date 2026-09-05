// Brand duotone cover art: a curated brand gradient picked
// deterministically from a seed string, optionally with a photo blended
// on top via mix-blend-luminosity — the image contributes light/dark
// structure while every hue comes from the gradient, keeping photography
// on brand. Used for the nyheter covers and the konsult avatars. Colors
// are the fixed brand hex values (not theme tokens): covers are artwork
// and keep their look in both themes.
import type { ComponentProps } from 'react'

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

export const DuotoneCover = ({
  seed,
  image,
  eager = false,
  imgProps,
}: {
  /** Deterministically picks the gradient — same seed, same art. */
  seed: string
  image?: string
  /** LCP candidates (featured cards, article heroes) must load eagerly;
   * everything below the fold stays lazy. */
  eager?: boolean
  /** Extra attributes for the <img> — typically a responsive `src`,
   * `srcSet` and `sizes` from the host app's image optimizer, so the
   * package itself stays framework-free. Spread last, so they win. */
  imgProps?: Omit<ComponentProps<'img'>, 'alt'>
}) => (
  // Covers are decorative — the adjacent heading carries the meaning.
  // `isolate` keeps the blend inside the cover instead of sampling
  // whatever the card renders beneath it.
  <div
    aria-hidden="true"
    className="relative isolate size-full"
    style={{ background: GRADIENTS[hash(seed) % GRADIENTS.length] }}
  >
    {image && (
      <img
        alt=""
        src={image}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        className="size-full object-cover opacity-90 mix-blend-luminosity"
        {...imgProps}
      />
    )}
  </div>
)
