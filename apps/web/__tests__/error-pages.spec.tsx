import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import Custom404 from '../pages/404'
import Custom500 from '../pages/500'

describe('404 page', () => {
  afterEach(() => cleanup())

  it('links to every hub and home', () => {
    render(<Custom404 />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Sidan finns inte',
    )
    for (const href of [
      '/',
      '/for-frilansare',
      '/for-foretag',
      '/uppdrag',
      '/kunskap',
      '/community',
    ]) {
      expect(
        screen
          .getAllByRole('link')
          .some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })
})

describe('500 page', () => {
  afterEach(() => cleanup())

  it('renders the minimal error message', () => {
    render(<Custom500 />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Något gick fel',
    )
  })
})
