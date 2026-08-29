// Single source of truth for the site's information architecture (see
// docs/superpowers/specs/2026-08-25-information-architecture-design.md).
// The nav tabs, footer, breadcrumbs, sitemap.xml and 404 page all render
// from this file, so adding a page here is what makes it exist site-wide.

export interface RouteMeta {
  path: string
  title: string
  description: string
  parent?: string
  noindex?: boolean
}

export interface NavTab {
  title: string
  icon: string
  hub: string
  items: { path: string; label: string }[]
}

export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: 'Sveriges största community för frilansare',
    description:
      'Frilansare Sverige är ett gratis community där frilansare delar uppdrag, kunskap och kollegskap — utan mellanhänder.',
  },

  // För frilansare
  {
    path: '/for-frilansare',
    title: 'För frilansare',
    description:
      'Det här får du som medlem i Frilansare Sverige: uppdragstips, kollegor i hela landet och svar på frilanslivets frågor — helt gratis.',
  },
  {
    path: '/ansokan',
    title: 'Ansök om medlemskap',
    description:
      'Ansök om medlemskap i Frilansare Sverige. Gratis, tar ett par minuter, och du får en inbjudan till vår Slack via mejl.',
    parent: '/for-frilansare',
  },
  {
    path: '/ansokan/tack',
    title: 'Tack för din ansökan',
    description: 'Din ansökan är inskickad.',
    parent: '/ansokan',
    noindex: true,
  },
  {
    path: '/sa-fungerar-det',
    title: 'Så fungerar communityt',
    description:
      'Så fungerar Frilansare Sverige: ansökan, Slack-kanalerna, uppdragstipsen och reglerna som håller communityt schysst.',
    parent: '/for-frilansare',
  },
  {
    path: '/fragor-och-svar',
    title: 'Frågor och svar',
    description:
      'Vanliga frågor om Frilansare Sverige: vem som kan bli medlem, vad det kostar och hur ansökan går till.',
    parent: '/for-frilansare',
  },

  // För företag
  {
    path: '/for-foretag',
    title: 'För företag',
    description:
      'Nå Sveriges största frilanscommunity direkt: tipsa om uppdrag gratis och kom i kontakt med frilansare utan mellanhänder.',
  },
  {
    path: '/tipsa',
    title: 'Tipsa om konsultuppdrag',
    description:
      'Har du ett uppdrag som passar en frilansare? Tipsa communityt gratis — uppdraget når tusentals frilansare direkt.',
    parent: '/for-foretag',
  },
  {
    path: '/tipsa/tack',
    title: 'Tack för tipset',
    description: 'Uppdraget är inskickat till communityt.',
    parent: '/tipsa',
    noindex: true,
  },
  {
    path: '/anlita-frilansare',
    title: 'Anlita en frilansare',
    description:
      'Hitta rätt konsult i Sveriges största frilanscommunity — utvecklare, designers, skribenter och fler. Direktkontakt, inga mellanhänder.',
    parent: '/for-foretag',
  },

  // Uppdrag
  {
    path: '/uppdrag',
    title: 'Lediga frilans- och konsultuppdrag',
    description:
      'Lediga frilansuppdrag och konsultuppdrag från Frilansare Sveriges community — tipsade av medlemmar, utan mellanhänder.',
  },

  // Kunskap
  {
    path: '/kunskap',
    title: 'Kunskap för frilansare',
    description:
      'Guider, verktyg och svar för dig som frilansar i Sverige — från fakturering och skatt till timpris och avtal.',
  },

  {
    path: '/recensioner',
    title: 'Recensioner',
    description:
      'Communityts recensioner av konsultmäklare, rekryterare och HR-bolag — villkor, transparens och bemötande betygsatt av frilansare.',
  },

  // Community
  {
    path: '/nyheter',
    title: 'Nyheter',
    description:
      'Nyheter från Frilansare Sverige — uppdateringar från communityt, sajten och frilanslivet i Sverige.',
  },
  {
    path: '/event',
    title: 'Event',
    description:
      'Kommande träffar och event för frilansare — AW, workshops och årsmöten från Frilansare Sverige.',
  },
  {
    path: '/community',
    title: 'Community',
    description:
      'Lär känna communityt bakom Frilansare Sverige: vilka vi är, hur du når oss och vad som gäller i vår Slack.',
  },
  {
    path: '/om',
    title: 'Om Frilansare Sverige',
    description:
      'Frilansare Sverige är ett ideellt, medlemsdrivet community med öppen källkod. Läs om varför vi finns och hur vi drivs.',
    parent: '/community',
  },
  {
    path: '/kontakt',
    title: 'Kontakt',
    description:
      'Kontakta Frilansare Sverige — frågor om medlemskap, uppdrag, press eller sajten.',
    parent: '/community',
  },
  {
    path: '/uppforandekod',
    title: 'Uppförandekod',
    description:
      'Uppförandekoden för Frilansare Sveriges community: så håller vi Slacken schysst, hjälpsam och fri från spam.',
    parent: '/community',
  },

  // Legal (footer only)
  {
    path: '/integritetspolicy',
    title: 'Integritetspolicy',
    description:
      'Så hanterar Frilansare Sverige dina personuppgifter när du ansöker om medlemskap eller tipsar om uppdrag.',
  },
  {
    path: '/cookies',
    title: 'Cookies',
    description: 'Så använder frilansaresverige.se cookies och lokal lagring.',
  },
  {
    path: '/villkor',
    title: 'Villkor',
    description:
      'Villkor för medlemskap och användning av Frilansare Sveriges community och sajt.',
  },
]

export const NAV_TABS: NavTab[] = [
  {
    title: 'Frilansare',
    icon: 'icon-[lucide--user-round]',
    hub: '/for-frilansare',
    items: [
      { path: '/ansokan', label: 'Bli medlem' },
      { path: '/sa-fungerar-det', label: 'Så fungerar det' },
      { path: '/fragor-och-svar', label: 'Frågor och svar' },
    ],
  },
  {
    title: 'Företag',
    icon: 'icon-[lucide--building-2]',
    hub: '/for-foretag',
    items: [
      { path: '/tipsa', label: 'Tipsa om uppdrag' },
      { path: '/anlita-frilansare', label: 'Anlita en frilansare' },
    ],
  },
  {
    title: 'Uppdrag',
    icon: 'icon-[lucide--briefcase-business]',
    hub: '/uppdrag',
    items: [],
  },
  {
    title: 'Kunskap',
    icon: 'icon-[lucide--book-open]',
    hub: '/kunskap',
    items: [
      { path: '/recensioner', label: 'Recensioner' },
      { path: '/fragor-och-svar', label: 'Frågor och svar' },
    ],
  },
  {
    title: 'Community',
    icon: 'icon-[lucide--heart-handshake]',
    hub: '/community',
    items: [
      { path: '/nyheter', label: 'Nyheter' },
      { path: '/event', label: 'Event' },
      { path: '/om', label: 'Om oss' },
      { path: '/uppforandekod', label: 'Uppförandekod' },
      { path: '/kontakt', label: 'Kontakt' },
    ],
  },
]

export const LEGAL_ROUTES = [
  { path: '/integritetspolicy', label: 'Integritetspolicy' },
  { path: '/cookies', label: 'Cookies' },
  { path: '/villkor', label: 'Villkor' },
]

const byPath = new Map(ROUTES.map((route) => [route.path, route]))

export const getRoute = (path: string): RouteMeta | undefined =>
  byPath.get(path)

export function getBreadcrumbs(
  path: string,
): { path: string; label: string }[] {
  const crumbs: { path: string; label: string }[] = []
  let current = byPath.get(path)
  while (current) {
    crumbs.unshift({ path: current.path, label: current.title })
    current = current.parent ? byPath.get(current.parent) : undefined
  }
  if (crumbs[0]?.path !== '/') {
    crumbs.unshift({ path: '/', label: 'Hem' })
  } else {
    crumbs[0] = { path: '/', label: 'Hem' }
  }
  return crumbs
}
