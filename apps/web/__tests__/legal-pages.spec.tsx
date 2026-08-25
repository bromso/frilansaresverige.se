import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import Cookies from '../pages/cookies'
import Integritetspolicy from '../pages/integritetspolicy'
import Villkor from '../pages/villkor'

afterEach(() => cleanup())

describe('legal pages', () => {
  it('integritetspolicy renders and mentions the two forms', () => {
    render(<Integritetspolicy />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Integritetspolicy',
    )
    expect(screen.getAllByText(/ansökan/i).length).toBeGreaterThan(0)
  })
  it('cookies page renders', () => {
    render(<Cookies />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Cookies',
    )
  })
  it('villkor renders', () => {
    render(<Villkor />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Villkor',
    )
  })
})
