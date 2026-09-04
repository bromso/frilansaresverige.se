import {
  MegaNav,
  type MegaNavItem,
  type MegaNavSection,
} from '@frilansaresverige/ui/ui/mega-nav'
import Link from 'next/link'
import { getRoute, NAV_TABS } from '../lib/routes'
import LogoMark from './LogoMark'
import { ThemeToggleButton } from './ThemeToggle'

// The site header: the ui package's Apple-style MegaNav fed from the
// routes registry. Each tab's dropdown shows the section's pages large
// plus a shared quick-links column; tabs without items (Uppdrag) are
// plain links with no dropdown.
const QUICK_LINKS: MegaNavSection = {
  title: 'Genvägar',
  links: [
    { label: 'Bli medlem', href: '/ansokan' },
    { label: 'Tipsa om uppdrag', href: '/tipsa' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
}

const NAV_ITEMS: MegaNavItem[] = NAV_TABS.map((tab) => ({
  label: tab.title,
  href: tab.hub,
  ...(tab.items.length > 0 && {
    sections: [
      {
        title: getRoute(tab.hub)?.title ?? tab.title,
        large: true,
        links: tab.items.map((item) => ({
          label: item.label,
          href: item.path,
        })),
      },
      QUICK_LINKS,
    ],
  }),
}))

const SiteNav = () => (
  <MegaNav
    items={NAV_ITEMS}
    LinkComponent={Link}
    logo={
      <Link href="/" title="Gå till startsidan" className="flex items-center">
        <LogoMark className="h-7 w-auto" />
      </Link>
    }
    actions={<ThemeToggleButton />}
  />
)

export default SiteNav
