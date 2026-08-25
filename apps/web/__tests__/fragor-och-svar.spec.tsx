import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { FAQ_ITEMS } from '../components/Faq/faq-items'
import FragorOchSvar from './fragor-och-svar'

describe('/fragor-och-svar', () => {
  afterEach(() => cleanup())

  it('renders every FAQ question', () => {
    render(<FragorOchSvar />)
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
  })

  it('emits FAQPage JSON-LD with all questions', () => {
    const { container } = render(<FragorOchSvar />)
    const data = [
      ...container.querySelectorAll('script[type="application/ld+json"]'),
    ]
      .map((s) => JSON.parse(s.textContent!))
      .find((d) => d['@type'] === 'FAQPage')
    expect(data.mainEntity).toHaveLength(FAQ_ITEMS.length)
    expect(data.mainEntity[0]['@type']).toBe('Question')
  })
})
