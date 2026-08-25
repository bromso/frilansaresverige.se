import { describe, expect, it, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
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
        screen.getAllByRole('link').some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })

  it('/for-foretag links to tipsa and anlita', () => {
    render(<ForForetag />)
    for (const href of ['/tipsa', '/anlita-frilansare']) {
      expect(
        screen.getAllByRole('link').some((a) => a.getAttribute('href') === href),
      ).toBe(true)
    }
  })

  it('/uppdrag links to the portal and tipsa', () => {
    render(<Uppdrag />)
    expect(
      screen
        .getAllByRole('link')
        .some(
          (a) =>
            a.getAttribute('href') === 'https://uppdrag.frilansaresverige.se/',
        ),
    ).toBe(true)
    expect(
      screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/tipsa'),
    ).toBe(true)
  })

  it('/anlita-frilansare has a tipsa call to action', () => {
    render(<AnlitaFrilansare />)
    expect(
      screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/tipsa'),
    ).toBe(true)
  })
})
