import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { loadSida } from '../lib/sidor.server'
import Cookies from '../pages/cookies'
import Integritetspolicy from '../pages/integritetspolicy'
import Villkor from '../pages/villkor'

afterEach(() => cleanup())

describe('legal pages', () => {
  it('integritetspolicy renders sections, side menu and the two forms', async () => {
    render(<Integritetspolicy {...(await loadSida('integritetspolicy'))} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Integritetspolicy',
    )
    expect(screen.getAllByText(/ansökan/i).length).toBeGreaterThan(0)
    const nav = screen.getByRole('navigation', { name: 'Innehåll' })
    expect(nav).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Dina rättigheter' })[0],
    ).toHaveAttribute('href', '#dina-rattigheter')
  })
  it('cookies page renders with its updated date', async () => {
    render(<Cookies {...(await loadSida('cookies'))} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Cookies',
    )
    expect(screen.getByText(/Senast uppdaterad/)).toBeInTheDocument()
  })
  it('villkor renders', async () => {
    render(<Villkor {...(await loadSida('villkor'))} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Villkor',
    )
  })
})
