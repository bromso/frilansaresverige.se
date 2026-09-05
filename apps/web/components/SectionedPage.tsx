import { LayoutMotion } from '@frilansaresverige/ui/lib/layout-motion'
import { m, useInView } from 'motion/react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { formatPostDate, type SidaMeta } from '../lib/content'
import { MDX_COMPONENTS } from './nyheter/MdxContent'
import Seo from './Seo'

// Long-form static pages (legal, uppförandekoden): MDX sections with a
// sticky scrollspy menu. Adapted from Skiper UI's Skiper60 terms layout
// (skiper-ui.com): a springing coral tick slides between menu items as
// the matching section scrolls into view.
export interface SerializedSection {
  id: string
  title: string
  source: MDXRemoteSerializeResult
}

interface SectionedPageProps {
  path: string
  title: string
  description: string
  meta: SidaMeta
  sections: SerializedSection[]
}

const Section = ({
  id,
  index,
  setActive,
  children,
}: {
  id: string
  index: number
  setActive: (index: number) => void
  children: ReactNode
}) => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, {
    amount: 0.3,
    margin: '-100px 0px -50% 0px',
  })

  useEffect(() => {
    if (isInView) {
      setActive(index)
    }
  }, [isInView, index, setActive])

  // scroll-mt clears the sticky header when the menu anchors here.
  return (
    <section ref={ref} id={id} className="scroll-mt-28">
      {children}
    </section>
  )
}

const SectionedPage = ({
  path,
  title,
  description,
  meta,
  sections,
}: SectionedPageProps) => {
  const [active, setActive] = useState(0)

  // The menu tick springs between items with layoutId: LayoutMotion
  // fetches motion's layout features for this page.
  return (
    <LayoutMotion>
      <Seo title={title} description={description} path={path} />
      <div className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-eyebrow uppercase">
          {meta.eyebrow}
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {meta.heading}
        </h1>
        {meta.intro && (
          <p className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
            {meta.intro}
          </p>
        )}

        <div className="mt-10 flex gap-12 md:mt-14">
          <nav aria-label="Innehåll" className="hidden md:block">
            <ul className="sticky top-28 w-[15em] space-y-4 border-l border-brand-cream/15">
              {sections.map((section, index) => (
                <li key={section.id} className="relative pl-4">
                  {active === index && (
                    <m.span
                      layoutId="active-section"
                      aria-hidden="true"
                      className="absolute top-1/2 -left-[1.5px] inline-block h-5 w-[2px] -translate-y-1/2 rounded-full bg-brand-coral"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <a
                    href={`#${section.id}`}
                    className={`block leading-snug transition-opacity duration-200 hover:opacity-100 ${
                      active === index
                        ? 'text-brand-cream opacity-100'
                        : 'text-brand-cream opacity-50'
                    }`}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex max-w-[44em] flex-1 flex-col gap-10 md:gap-14">
            {sections.map((section, index) => (
              <Section
                key={section.id}
                id={section.id}
                index={index}
                setActive={setActive}
              >
                <h2 className="font-display text-2xl font-bold tracking-tight text-brand-cream">
                  {section.title}
                </h2>
                <MDXRemote {...section.source} components={MDX_COMPONENTS} />
              </Section>
            ))}
            {meta.updated && (
              <p className="text-sm text-brand-cream/60">
                Senast uppdaterad: {formatPostDate(meta.updated)}
              </p>
            )}
          </div>
        </div>
      </div>
    </LayoutMotion>
  )
}

export default SectionedPage
