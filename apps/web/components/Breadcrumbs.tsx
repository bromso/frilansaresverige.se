import Link from 'next/link'
import { getBreadcrumbs } from '../lib/routes'
import { SITE_URL } from './Seo'

const Breadcrumbs = ({ path }: { path: string }) => {
  const crumbs = getBreadcrumbs(path)
  if (crumbs.length < 2) {
    return null
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${SITE_URL}${crumb.path}`,
    })),
  }

  return (
    <nav aria-label="Brödsmulor" className="w-full pt-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-brand-cream/60">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="icon-[lucide--chevron-right] size-3.5"
                />
              )}
              {last ? (
                <span aria-current="page" className="text-brand-cream/85">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="hover:text-brand-cream hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  )
}

export default Breadcrumbs
