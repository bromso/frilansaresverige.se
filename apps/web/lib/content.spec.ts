import { describe, expect, it } from 'bun:test'
import {
  formatEventBadge,
  formatEventDate,
  formatEventTime,
  formatPostDate,
  formatScore,
  GIG_ROLES,
  parseEventMeta,
  parseGigMeta,
  parseLocalDate,
  parsePostMeta,
  parseReviewMeta,
  parseSidaMeta,
  REVIEW_CATEGORIES,
  slugifyHeading,
  sortPosts,
  splitEvents,
  splitSections,
} from './content'
import {
  getAllEvents,
  getAllGigs,
  getAllPosts,
  getAllReviews,
  getEvent,
  getGig,
  getPost,
  getReview,
  getSida,
} from './content.server'

const post = (slug: string, date: string) =>
  parsePostMeta(slug, {
    title: 'T',
    excerpt: 'E',
    date,
    category: 'Nyhet',
  })

describe('parsePostMeta', () => {
  it('returns a validated PostMeta', () => {
    expect(post('hej', '2026-08-18')).toEqual({
      slug: 'hej',
      title: 'T',
      excerpt: 'E',
      date: '2026-08-18',
      category: 'Nyhet',
    })
  })

  it('throws on missing fields, naming the file', () => {
    expect(() => parsePostMeta('trasig', { title: 'T' })).toThrow(/trasig/)
  })

  it('rejects unquoted YAML dates (Date objects)', () => {
    expect(() =>
      parsePostMeta('datum', {
        title: 'T',
        excerpt: 'E',
        date: new Date(),
        category: 'Nyhet',
      }),
    ).toThrow(/citera/i)
  })
})

describe('parseEventMeta', () => {
  it('returns a validated EventMeta with optionals', () => {
    const meta = parseEventMeta('aw', {
      title: 'AW',
      excerpt: 'E',
      startDate: '2026-09-17T17:30',
      location: 'Baren',
      city: 'Stockholm',
      rsvpUrl: 'https://example.com',
      price: 'Gratis',
    })
    expect(meta.startDate).toBe('2026-09-17T17:30')
    expect(meta.rsvpUrl).toBe('https://example.com')
    expect(meta.endDate).toBeUndefined()
  })

  it('rejects malformed dates', () => {
    expect(() =>
      parseEventMeta('fel', {
        title: 'T',
        excerpt: 'E',
        startDate: '17 september',
        location: 'L',
        city: 'C',
      }),
    ).toThrow(/Ogiltigt datum/)
  })
})

describe('parseGigMeta', () => {
  it('returns a validated GigMeta with optionals', () => {
    const meta = parseGigMeta('frontend', {
      title: 'Frontendutvecklare',
      excerpt: 'E',
      date: '2026-08-26',
      role: 'Utveckling',
      city: 'Distans',
      scope: 'Heltid',
      client: 'Fintechbolag',
      applyUrl: 'mailto:jobb@example.se',
    })
    expect(meta.role).toBe('Utveckling')
    expect(meta.client).toBe('Fintechbolag')
  })

  it('rejects roles outside the fixed set', () => {
    expect(() =>
      parseGigMeta('konstig', {
        title: 'T',
        excerpt: 'E',
        date: '2026-08-26',
        role: 'Trollkarl',
        city: 'Distans',
        scope: 'Heltid',
      }),
    ).toThrow(/Trollkarl/)
    expect(GIG_ROLES).toContain('Utveckling')
  })
})

describe('parseReviewMeta', () => {
  const data = (scores: Record<string, unknown>) => ({
    title: 'Konsultio',
    excerpt: 'E',
    date: '2026-08-20',
    category: 'Konsultmäklare',
    website: 'https://example.se',
    scores,
  })

  it('computes the overall score as the criteria average', () => {
    const meta = parseReviewMeta(
      'konsultio',
      data({ villkor: 4, transparens: 4.5, bemotande: 4.5 }),
    )
    expect(meta.overall).toBe(4.3)
    expect(meta.website).toBe('https://example.se')
    expect(REVIEW_CATEGORIES).toContain(meta.category)
  })

  it('rejects scores outside 1–5 or off the half-step grid', () => {
    expect(() =>
      parseReviewMeta(
        'fel',
        data({ villkor: 5.5, transparens: 4, bemotande: 4 }),
      ),
    ).toThrow(/villkor/)
    expect(() =>
      parseReviewMeta(
        'fel',
        data({ villkor: 3.7, transparens: 4, bemotande: 4 }),
      ),
    ).toThrow(/villkor/)
  })

  it('rejects missing criteria and unknown categories', () => {
    expect(() =>
      parseReviewMeta('fel', data({ villkor: 4, transparens: 4 })),
    ).toThrow(/bemotande/)
    expect(() =>
      parseReviewMeta('fel', {
        ...data({ villkor: 4, transparens: 4, bemotande: 4 }),
        category: 'Bemanning',
      }),
    ).toThrow(/Bemanning/)
  })
})

describe('slugifyHeading', () => {
  it('lowercases, folds Swedish letters and dashes the rest', () => {
    expect(slugifyHeading('Så använder vi lagring i webbläsaren')).toBe(
      'sa-anvander-vi-lagring-i-webblasaren',
    )
    expect(slugifyHeading('Cookies & statistik')).toBe('cookies-statistik')
  })
})

describe('splitSections', () => {
  it('splits markdown into sections on h2 headings', () => {
    const sections = splitSections(
      '## Första delen\n\nText ett.\n\nMer text.\n\n## Andra delen\n\nText två.\n',
    )
    expect(sections).toEqual([
      {
        id: 'forsta-delen',
        title: 'Första delen',
        body: 'Text ett.\n\nMer text.',
      },
      { id: 'andra-delen', title: 'Andra delen', body: 'Text två.' },
    ])
  })

  it('ignores content before the first heading', () => {
    const sections = splitSections('Inledning.\n\n## Rubrik\n\nBrödtext.')
    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBe('Rubrik')
  })
})

describe('parseSidaMeta', () => {
  it('validates heading and eyebrow, keeps optionals', () => {
    const meta = parseSidaMeta('cookies', {
      heading: 'Cookies och lokal lagring',
      eyebrow: 'Juridik',
      intro: 'Så använder vi cookies.',
      updated: '2026-08-25',
    })
    expect(meta.heading).toBe('Cookies och lokal lagring')
    expect(meta.updated).toBe('2026-08-25')
  })

  it('throws on missing heading', () => {
    expect(() => parseSidaMeta('trasig', { eyebrow: 'Juridik' })).toThrow(
      /trasig/,
    )
  })
})

describe('formatScore', () => {
  it('renders one decimal with a Swedish comma', () => {
    expect(formatScore(4.3)).toBe('4,3')
    expect(formatScore(4)).toBe('4,0')
  })
})

describe('sortPosts', () => {
  it('sorts newest first', () => {
    const sorted = sortPosts([post('a', '2026-01-01'), post('b', '2026-06-01')])
    expect(sorted.map((p) => p.slug)).toEqual(['b', 'a'])
  })
})

describe('splitEvents', () => {
  const ev = (slug: string, startDate: string, endDate?: string) =>
    parseEventMeta(slug, {
      title: 'T',
      excerpt: 'E',
      startDate,
      ...(endDate && { endDate }),
      location: 'L',
      city: 'C',
    })
  const now = parseLocalDate('2026-08-29T12:00')

  it('splits into upcoming (soonest first) and past (latest first)', () => {
    const { upcoming, past } = splitEvents(
      [
        ev('okt', '2026-10-08T17:00'),
        ev('maj', '2026-05-21T17:30'),
        ev('sep', '2026-09-17T17:30'),
        ev('feb', '2026-02-26T18:00'),
      ],
      now,
    )
    expect(upcoming.map((e) => e.slug)).toEqual(['sep', 'okt'])
    expect(past.map((e) => e.slug)).toEqual(['maj', 'feb'])
  })

  it('keeps an in-progress event (endDate in the future) upcoming', () => {
    const { upcoming } = splitEvents(
      [ev('pagar', '2026-08-29T10:00', '2026-08-29T18:00')],
      now,
    )
    expect(upcoming).toHaveLength(1)
  })
})

describe('date formatting (sv-SE)', () => {
  it('formats post dates', () => {
    expect(formatPostDate('2026-08-18')).toBe('18 augusti 2026')
  })

  it('formats event dates with weekday', () => {
    expect(formatEventDate('2026-09-17T17:30')).toBe(
      'torsdag 17 september 2026',
    )
  })

  it('formats time ranges', () => {
    expect(formatEventTime('2026-09-17T17:30', '2026-09-17T20:00')).toBe(
      '17:30–20:00',
    )
    expect(formatEventTime('2026-09-17T17:30')).toBe('17:30')
  })

  it('builds the calendar badge', () => {
    expect(formatEventBadge('2026-09-17T17:30')).toEqual({
      day: '17',
      month: 'sep',
    })
  })
})

describe('content directory', () => {
  it('parses every post, event and gig on disk', () => {
    const posts = getAllPosts()
    const events = getAllEvents()
    const gigs = getAllGigs()
    expect(posts.length).toBeGreaterThanOrEqual(6)
    expect(events.length).toBeGreaterThanOrEqual(4)
    expect(gigs.length).toBeGreaterThanOrEqual(7)
    for (const p of posts) {
      expect(getPost(p.slug).content.length).toBeGreaterThan(100)
    }
    for (const e of events) {
      expect(getEvent(e.slug).content.length).toBeGreaterThan(100)
    }
    for (const g of gigs) {
      expect(getGig(g.slug).content.length).toBeGreaterThan(100)
    }
  })

  it('lists gigs newest first', () => {
    const gigs = getAllGigs()
    const dates = gigs.map((g) => g.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('parses the static sidor with their sections', () => {
    for (const slug of [
      'cookies',
      'integritetspolicy',
      'villkor',
      'uppforandekod',
    ]) {
      const { meta, sections } = getSida(slug)
      expect(meta.heading.length).toBeGreaterThan(0)
      expect(sections.length).toBeGreaterThanOrEqual(3)
      for (const section of sections) {
        expect(section.id).toMatch(/^[a-z0-9-]+$/)
        expect(section.body.length).toBeGreaterThan(20)
      }
    }
  })

  it('parses every review on disk, sorted best first', () => {
    const reviews = getAllReviews()
    expect(reviews.length).toBeGreaterThanOrEqual(6)
    for (const r of reviews) {
      expect(getReview(r.slug).content.length).toBeGreaterThan(100)
    }
    const overalls = reviews.map((r) => r.overall)
    expect(overalls).toEqual([...overalls].sort((a, b) => b - a))
  })
})
