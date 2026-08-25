import Link from 'next/link'
import type { ReactNode } from 'react'
import { getRoute } from '../lib/routes'
import Breadcrumbs from './Breadcrumbs'
import Seo from './Seo'

export interface HubLink {
  href: string
  label: string
  text: string
  icon: string
  external?: boolean
}

interface HubPageProps {
  path: string
  eyebrow: string
  heading: string
  intro: ReactNode
  links: HubLink[]
  children?: ReactNode
}

const HubPage = ({
  path,
  eyebrow,
  heading,
  intro,
  links,
  children,
}: HubPageProps) => {
  const meta = getRoute(path)!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={path} />
      <Breadcrumbs path={path} />
      <section className="flex w-full max-w-[60em] flex-col py-12 md:py-16">
        <p className="font-display mb-3 text-sm font-bold tracking-widest text-brand-coral uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display max-w-[16em] text-4xl font-extrabold tracking-tight text-brand-cream md:text-5xl">
          {heading}
        </h1>
        <div className="mt-4 max-w-[36em] text-lg leading-[1.6] text-brand-cream/85">
          {intro}
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {links.map((link) => {
            const card = (
              <span className="flex h-full flex-col rounded-3xl bg-brand-cream/5 p-7 transition-colors hover:bg-brand-cream/10">
                <span
                  aria-hidden="true"
                  className={`${link.icon} size-7 text-brand-coral`}
                />
                <span className="font-display mt-4 text-xl font-bold text-brand-cream">
                  {link.label}
                </span>
                <span className="mt-2 leading-[1.6] text-brand-cream/80">
                  {link.text}
                </span>
              </span>
            )
            return (
              <li key={link.href}>
                {link.external ? (
                  <a href={link.href} className="block h-full">
                    {card}
                  </a>
                ) : (
                  <Link href={link.href} className="block h-full">
                    {card}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
        {children}
      </section>
    </>
  )
}

export default HubPage
