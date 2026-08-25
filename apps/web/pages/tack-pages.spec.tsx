import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import AnsokanTack from './ansokan/tack'
import TipsaTack from './tipsa/tack'

describe('tack pages', () => {
  afterEach(() => cleanup())

  it('ansokan/tack confirms the application', () => {
    render(<AnsokanTack />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tack för din ansökan',
    )
  })

  it('tipsa/tack confirms the gig tip', () => {
    render(<TipsaTack />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tack för tipset',
    )
  })
})
