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
      'Frilansare Sverige är ett gratis community i Slack där tusentals frilansare delar uppdrag, kunskap och kollegor. Inga avgifter, inga mellanhänder.',
  },

  // För frilansare
  {
    path: '/for-frilansare',
    title: 'För frilansare',
    description:
      'Det här får du som medlem i Frilansare Sverige: uppdragstips, kollegor i hela landet och svar på frilanslivets frågor. Helt gratis.',
  },
  {
    path: '/ansokan',
    title: 'Ansök om medlemskap',
    description:
      'Ansök om medlemskap i Frilansare Sverige. Det är gratis, tar ett par minuter och du får en inbjudan till vår Slack via mejl.',
    parent: '/for-frilansare',
  },
  {
    path: '/ansokan/tack',
    title: 'Tack för din ansökan',
    description: 'Din ansökan är inskickad. Vi hör av oss via mejl.',
    parent: '/ansokan',
    noindex: true,
  },
  {
    path: '/sa-fungerar-det',
    title: 'Så fungerar communityt',
    description:
      'Så fungerar Frilansare Sverige: ansökan, kanalerna i Slack, uppdragstipsen och reglerna som håller communityt schysst.',
    parent: '/for-frilansare',
  },
  {
    path: '/fragor-och-svar',
    title: 'Frågor och svar',
    description:
      'Vanliga frågor om Frilansare Sverige: vem som kan bli medlem, vad det kostar, hur ansökan går till och vad som händer sedan.',
    parent: '/for-frilansare',
  },

  // För företag
  {
    path: '/for-foretag',
    title: 'För företag',
    description:
      'Söker du en konsult? Tipsa Sveriges största frilanscommunity om uppdraget. Gratis, och frilansarna kontaktar dig direkt.',
  },
  {
    path: '/tipsa',
    title: 'Tipsa om konsultuppdrag',
    description:
      'Har du ett uppdrag som passar en frilansare? Tipsa communityt gratis, så når det tusentals frilansare i Slack samma dag.',
    parent: '/for-foretag',
  },
  {
    path: '/tipsa/tack',
    title: 'Tack för tipset',
    description: 'Tipset är inskickat till communityt. Tack för att du delar.',
    parent: '/tipsa',
    noindex: true,
  },
  {
    path: '/anlita-frilansare',
    title: 'Anlita en frilansare',
    description:
      'Hitta rätt konsult i Sveriges största frilanscommunity: utvecklare, designers, skribenter, projektledare och fler. Direktkontakt, ingen förmedlingsavgift.',
    parent: '/for-foretag',
  },

  // Uppdrag
  {
    path: '/uppdrag',
    title: 'Lediga frilans- och konsultuppdrag',
    description:
      'Lediga frilansuppdrag och konsultuppdrag tipsade av medlemmar och företag i Frilansare Sverige. Du kontaktar uppdragsgivaren direkt.',
  },

  // Kunskap
  {
    path: '/kunskap',
    title: 'Kunskap för frilansare',
    description:
      'Guider, verktyg och svar för dig som frilansar i Sverige, från fakturering och skatt till timpris och avtal. Skrivet av frilansare.',
  },

  {
    path: '/recensioner',
    title: 'Recensioner',
    description:
      'Frilansarnas egna recensioner av konsultmäklare, rekryterare och HR-bolag. Villkor, transparens och bemötande betygsatt av medlemmarna.',
  },

  // Community
  {
    path: '/nyheter',
    title: 'Nyheter',
    description:
      'Nyheter från Frilansare Sverige: det senaste från communityt, sajten och frilanslivet i Sverige.',
  },
  {
    path: '/event',
    title: 'Event',
    description:
      'Kommande träffar och event för frilansare: AW:er, workshops och årsmöten från Frilansare Sverige. Gratis för medlemmar.',
  },
  {
    path: '/community',
    title: 'Community',
    description:
      'Lär känna communityt bakom Frilansare Sverige: vilka vi är, hur vi drivs, hur du når oss och vad som gäller i vår Slack.',
  },
  {
    path: '/om',
    title: 'Om Frilansare Sverige',
    description:
      'Frilansare Sverige är ett ideellt community som drivs av sina medlemmar, med öppen källkod. Läs om varför vi finns och hur vi jobbar.',
    parent: '/community',
  },
  {
    path: '/kontakt',
    title: 'Kontakt',
    description:
      'Kontakta Frilansare Sverige med frågor om medlemskap, uppdrag, press eller sajten.',
    parent: '/community',
  },
  {
    path: '/uppforandekod',
    title: 'Uppförandekod',
    description:
      'Uppförandekoden för Frilansare Sverige: så håller vi Slacken schysst, hjälpsam och fri från spam.',
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
