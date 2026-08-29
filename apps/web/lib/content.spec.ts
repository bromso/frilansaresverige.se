import { describe, expect, it } from 'bun:test'
import {
  formatEventBadge,
  formatEventDate,
  formatEventTime,
  formatPostDate,
  GIG_ROLES,
  parseEventMeta,
  parseGigMeta,
  parseLocalDate,
  parsePostMeta,
  sortPosts,
  splitEvents,
} from './content'
import {
  getAllEvents,
  getAllGigs,
  getAllPosts,
  getEvent,
  getGig,
  getPost,
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
})
