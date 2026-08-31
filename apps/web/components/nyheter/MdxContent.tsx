import type { MDXRemoteProps } from 'next-mdx-remote'

// Brand prose styling for MDX bodies (articles and event descriptions).
// No typography plugin — the map keeps the site's ink-on-ground tokens
// and display font in one place.
export const MDX_COMPONENTS: MDXRemoteProps['components'] = {
  h2: (props) => (
    <h2
      className="font-display mt-12 mb-4 text-2xl font-bold tracking-tight text-brand-cream md:text-3xl"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="font-display mt-8 mb-3 text-xl font-bold text-brand-cream"
      {...props}
    />
  ),
  p: (props) => (
    <p className="my-5 leading-[1.7] text-brand-cream/85" {...props} />
  ),
  a: (props) => (
    <a
      className="text-brand-coral underline underline-offset-2 hover:no-underline"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="my-5 list-disc space-y-2 pl-6 leading-[1.7] text-brand-cream/85"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="my-5 list-decimal space-y-2 pl-6 leading-[1.7] text-brand-cream/85"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="font-display my-8 border-l-2 border-brand-coral pl-6 text-xl leading-[1.5] text-brand-cream"
      {...props}
    />
  ),
  strong: (props) => (
    <strong className="font-semibold text-brand-cream" {...props} />
  ),
  code: (props) => (
    <code
      className="rounded bg-brand-cream/10 px-1.5 py-0.5 font-mono text-[0.9em] text-brand-cream"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-brand-cream/10" />,
}
