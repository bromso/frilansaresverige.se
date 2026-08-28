import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import Breadcrumbs from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders the trail with the last crumb unlinked', () => {
    render(<Breadcrumbs path="/uppforandekod" />)
    const nav = screen.getByRole('navigation', { name: 'Brödsmulor' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hem' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute(
      'href',
      '/community',
    )
    expect(screen.queryByRole('link', { name: 'Uppförandekod' })).toBeNull()
    expect(screen.getByText('Uppförandekod')).toBeInTheDocument()
  })

  it('emits BreadcrumbList JSON-LD', () => {
    const { container } = render(<Breadcrumbs path="/uppforandekod" />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script!.textContent!)
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement).toHaveLength(3)
    expect(data.itemListElement[2].name).toBe('Uppförandekod')
  })

  it('renders a dynamic leaf via the crumb prop', () => {
    render(
      <Breadcrumbs
        path="/nyheter/[slug]"
        crumb={{
          section: '/nyheter',
          path: '/nyheter/hej',
          label: 'Hej världen',
        }}
      />,
    )
    expect(screen.getByRole('link', { name: 'Nyheter' })).toHaveAttribute(
      'href',
      '/nyheter',
    )
    expect(screen.getByText('Hej världen')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Hej världen' })).toBeNull()
  })

  it('renders nothing on the home page', () => {
    const { container } = render(<Breadcrumbs path="/" />)
    expect(container.innerHTML).toBe('')
  })
})
