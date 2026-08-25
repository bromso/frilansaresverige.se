# Information architecture for frilansaresverige.se

**Date:** 2026-08-25
**Status:** Approved (design), pending implementation plan
**Scope:** frilansaresverige.se only. The gig portal stays on uppdrag.frilansaresverige.se; this site links to it. Dual audience (frilansare + företag), full editorial ambition, SEO as the highest priority.

## Context

The site today has three pages — `/` (home), `/ansokan` (membership application), `/tipsa` (gig tip form) — plus an external portal subdomain, a Slack community, and an open-source GitHub repo. The site runs Next.js (Pages Router) in a Bun monorepo. Navigation will use the Skiper UI "Expandable tabs" pattern (Skiper96): a small fixed set of top-level tabs, each expanding to a short list of sub-items. That constrains the IA to **at most ~6 top-level sections with shallow sub-lists**, which this design respects (5 tabs + a standalone CTA button).

## Research summary

### Keyword research (OpenSEO/DataForSEO, Sweden, Swedish, 2026-08)

Winnable clusters, by opportunity:

| Cluster | Representative keywords (vol/mo, KD) | IA consequence |
|---|---|---|
| Fakturera utan företag / egenanställning | fakturera utan företag 1 900 KD40 · faktura utan företag 1 900 KD46 · fakturera privatperson 720 KD1 · egenanställningsföretag 390 KD16 · egenanställning 210 KD11 · fakturera utan f-skatt 170 KD7 | Pillar guide + cluster articles + neutral comparison page |
| Starta eget | starta eget-bidrag 4 400 KD4 · starta enskild firma 2 900 KD13 · enskild firma skatt 880 KD3 · enskild firma eller aktiebolag 480 KD5 · steg för steg 140 KD11 | Pillar guide + cluster |
| Lön/skatt-kalkylatorer | räkna ut skatt enskild firma 390 KD11 · räkna ut lön enskild firma 260 KD14 · lönekalkylator enskild firma 170 KD0 · konsult lön kalkylator 110 KD0 | Interactive calculator pages (KD-0 wins, link magnets) |
| Uppdrag | konsultuppdrag 880 KD0 · konsultuppdrag it 260 KD0 · konsultuppdrag stockholm 210 KD2 · lediga konsultuppdrag 140 KD4 · hitta konsultuppdrag 110 KD11 | /uppdrag landing + phase-2 city/skill pages funneling to the portal |
| Definitional | vad är en faktura 320 KD0 · frilansare betyder 140 · vad är frilansare 110 | Ordlista (glossary) |
| Brand | frilansare sverige 110 KD4 | Home/brand pages already cover it |

Company-side terms (anlita frilansare ≈10/mo, hitta frilansare ≈0) have negligible volume: the **företag section is for navigation/conversion, not SEO**.

### SERP checks

- **"fakturera utan företag"**: ranked by commercial egenanställningsbolag (Invozio, Cool Company, Frilans Finans, Workamo…) plus two independent "bäst i test" comparison sites and Skatteverket/verksamt.se. A neutral, community-run jämförelse is a credible wedge no commercial player can copy.
- **"konsultuppdrag"**: job boards and konsultmäklare (Ework/Verama, Brainville, Randstad, Indeed…). We compete via landing pages that funnel to the portal, not by hosting listings here.

### Competitor IA sweep (9 sites)

Frilans Finans, Cool Company, Brainville, Worknode, Frilans Riks, Freelancers Union, Malt, YunoJuno, Indie Hackers converge on: two audience hubs ("För frilansare"/"För företag"), one named editorial hub with typed content (guides, articles, stories, events), a lönekalkylator as link magnet, FAQ, and a trust layer (om/kontakt/press/legal). Community-specific patterns worth adopting: "ask the community" help page, avtalsmallar, code of conduct, annual statistics report from member surveys, partner offers.

## Sitemap

Five top-level sections mapped 1:1 to the Skiper96 tabs; "Ansök om medlemskap" remains a standalone CTA button outside the tabs.

```
/                                    Hem
│
├─ FÖR FRILANSARE          tab 1 → hub /for-frilansare
│  ├─ /ansokan                       Bli medlem (existing)
│  ├─ /sa-fungerar-det               Så fungerar communityt (Slack, kanaler, regler i korthet)
│  ├─ /medlemsformaner               Partnererbjudanden (future)
│  └─ /fragor-och-svar               FAQ (lifted out of /ansokan; own SEO life)
│
├─ FÖR FÖRETAG             tab 2 → hub /for-foretag
│  ├─ /tipsa                         Tipsa om uppdrag (existing)
│  └─ /anlita-frilansare             Hitta rätt konsult — conversion page; addresses
│                                    arbetsgivare, förmedlare and konsultbolag as sub-audiences
│
├─ UPPDRAG                 tab 3 → hub /uppdrag
│  │                                 SEO landing "lediga frilans- & konsultuppdrag",
│  │                                 links onward to the portal subdomain
│  └─ /uppdrag/[slug]                Phase 2: city/skill pages (stockholm, goteborg, it …)
│                                    targeting KD 0–4 terms; thin-but-real content + portal link
│
├─ KUNSKAP                 tab 4 → hub /kunskap        ← the SEO engine
│  ├─ /guider/[slug]                 Pillar guides + clusters:
│  │     fakturera-utan-foretag        (pillar 1)
│  │     starta-enskild-firma          (pillar 2)
│  │     timpris-och-arvode            (pillar 3)
│  │     + cluster articles under each pillar
│  ├─ /jamfor/egenanstallningsforetag  Neutral comparison — the wedge into the biggest SERP
│  ├─ /kalkylatorer/[slug]           lonekalkylator, timpriskalkylator (KD-0 wins, link magnets)
│  ├─ /ordlista + /ordlista/[term]   Frilansordlista (f-skatt, egenanstallning, konsultmaklare …)
│  ├─ /blogg + /blogg/[slug]         News, member interviews, columns (RSS)
│  └─ /frilansrapporten              Annual community survey — unique data, link magnet
│
├─ COMMUNITY               tab 5 → hub /community
│  ├─ /om                            Om oss + mission + open source
│  ├─ /event                         AWs, meetups, calendar
│  ├─ /roster                        Member stories (grows out of today's testimonials)
│  ├─ /uppforandekod                 Code of conduct
│  └─ /kontakt                       Contact + press info
│
├─ Legal (footer only):    /integritetspolicy · /cookies · /villkor
│
└─ Utility & error pages:
   ├─ /404                           Custom: popular pages + Slack link (pages/404.tsx)
   ├─ /500                           Custom: minimal, renders without client JS (pages/500.tsx)
   ├─ /ansokan/tack · /tipsa/tack    Real thank-you pages (noindex) instead of inline status —
   │                                 enables conversion tracking
   └─ sitemap.xml · robots.txt · RSS for /blogg
```

## SEO mechanics the IA builds in

- **Slugs:** Swedish, ASCII only (å/ä→a, ö→o), lowercase, hyphenated.
- **Topic clusters:** every cluster article links to its pillar; every pillar links to all its cluster articles; hubs (/kunskap, /uppdrag) link to everything one level down.
- **Breadcrumbs** with schema.org BreadcrumbList markup on everything under /kunskap and /uppdrag.
- **Link magnets:** calculators, the jämförelse, and frilansrapporten are the assets other sites will link to; they live at short stable URLs.
- **Indexing:** tack pages, 404/500 noindexed; sitemap.xml generated from the route tree; per-page meta/OG via a shared SEO component.
- **No hreflang** — single-language site.

## Error handling (page level)

- `pages/404.tsx` — custom 404 with links to the five hubs and the Slack community; statically generated.
- `pages/500.tsx` — minimal static page, no dependence on client JS or the shader components.
- Form failures remain inline in `/ansokan` and `/tipsa`; successes navigate to the tack pages.

## Build order (priority = traffic)

1. Utility base: 404, 500, tack pages, sitemap.xml/robots.txt, SEO meta component, breadcrumbs.
2. Kunskap engine: /kunskap hub, three pillar guides, /jamfor/egenanstallningsforetag, first calculator.
3. Hubs & nav: Skiper96 navigation, /for-frilansare, /for-foretag, /fragor-och-svar, /sa-fungerar-det, /anlita-frilansare.
4. Community & trust: /om, /kontakt, /uppforandekod, /uppdrag landing.
5. Growth: /ordlista, /blogg, /event, /roster, /uppdrag/[slug] city/skill pages, /frilansrapporten, /medlemsformaner.

## Out of scope

- Moving the portal onto this domain (revisit if/when the subdomain seam becomes a problem).
- Membership login/accounts — the community lives in Slack.
- CMS choice for /guider and /blogg content — an implementation-plan decision, not an IA one.
