import { useInView } from 'motion/react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { formatPostDate, type SidaMeta } from '../lib/content'
import { MDX_COMPONENTS } from './nyheter/MdxContent'
import Seo from './Seo'

// Long-form static pages (legal, uppförandekoden): MDX sections with a
// sticky scrollspy menu. Adapted from Skiper UI's Skiper60 terms layout
// (skiper-ui.com): a coral tick slides between menu items as the
// matching section scrolls into view.
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

/** The tick is `h-5`: 20px. Used to centre it on the active item. */
const TICK_HEIGHT = 20

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
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const [offset, setOffset] = useState(0)

  // The menu tick is a single element moved with a CSS transform rather
  // than a `layoutId` shared between items: a layoutId would make motion
  // fetch its 48 KB layout-features chunk on every legal page just to
  // slide a 2px bar. The offset is the active item's vertical centre
  // relative to the <ul>, re-read on resize since the titles wrap.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => {
      const item = itemRefs.current[active]
      if (!item) return
      setOffset(item.offsetTop + item.offsetHeight / 2 - TICK_HEIGHT / 2)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active])

  return (
    <>
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
              <span
                aria-hidden="true"
                className="absolute top-0 -left-[1.5px] inline-block h-5 w-[2px] rounded-full bg-highlight transition-transform duration-300 ease-(--expo-out) motion-reduce:transition-none"
                style={{ transform: `translateY(${offset}px)` }}
              />
              {sections.map((section, index) => (
                <li
                  key={section.id}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  className="pl-4"
                >
                  <a
                    href={`#${section.id}`}
                    className={`block leading-snug transition-opacity duration-200 hover:opacity-100 ${
                      active === index
                        ? 'text-brand-cream opacity-100'
                        : 'text-brand-cream opacity-75'
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
              <p className="text-sm text-brand-cream/75">
                Senast uppdaterad: {formatPostDate(meta.updated)}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SectionedPage
