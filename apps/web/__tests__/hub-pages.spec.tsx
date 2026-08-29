import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { parseGigMeta } from '../lib/content'
import AnlitaFrilansare from '../pages/anlita-frilansare'
import ForForetag from '../pages/for-foretag'
import ForFrilansare from '../pages/for-frilansare'
import Uppdrag from '../pages/uppdrag/index'

describe('hub pages', () => {
  afterEach(() => cleanup())
  it('/for-frilansare links to its section pages', () => {
    render(<ForFrilansare />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    for (const href of ['/ansokan', '/sa-fungerar-det', '/fragor-och-svar']) {
      expect(
        screen
          .getAllByRole('link')
          .some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })

  it('/for-foretag links to tipsa and anlita', () => {
    render(<ForForetag />)
    for (const href of ['/tipsa', '/anlita-frilansare']) {
      expect(
        screen
          .getAllByRole('link')
          .some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })

  const gig = (slug: string, title: string, role: string) =>
    parseGigMeta(slug, {
      title,
      excerpt: 'E',
      date: '2026-08-26',
      role,
      city: 'Distans',
      scope: 'Heltid',
    })

  it('/uppdrag lists gigs and links to tipsa', () => {
    render(<Uppdrag gigs={[gig('frontend', 'Frontend', 'Utveckling')]} />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/uppdrag/frontend')
    expect(hrefs).toContain('/tipsa')
  })

  it('/uppdrag filters the list by role chip', async () => {
    render(
      <Uppdrag
        gigs={[
          gig('frontend', 'Frontendutvecklare', 'Utveckling'),
          gig('ux', 'UX-designer', 'Design'),
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Design' }))
    expect(screen.queryByText('Frontendutvecklare')).toBeNull()
    expect(screen.getByText('UX-designer')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Alla' }))
    expect(screen.getByText('Frontendutvecklare')).toBeInTheDocument()
  })

  it('/anlita-frilansare has a tipsa call to action', () => {
    render(<AnlitaFrilansare />)
    expect(
      screen
        .getAllByRole('link')
        .some((a) => a.getAttribute('href') === '/tipsa'),
    ).toBe(true)
  })
})
