import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import Community from './community'
import Kontakt from './kontakt'
import Kunskap from './kunskap'
import Om from './om'
import SaFungerarDet from './sa-fungerar-det'
import Uppforandekod from './uppforandekod'

afterEach(() => cleanup())

const rendersH1 = (Page: () => ReturnType<typeof Community>, text: RegExp) => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(text)
}

describe('content pages', () => {
  it('sa-fungerar-det', () => rendersH1(SaFungerarDet, /Så fungerar/))
  it('kunskap', () => rendersH1(Kunskap, /Kunskap/))
  it('community', () => rendersH1(Community, /communityt/i))
  it('om', () => rendersH1(Om, /Om Frilansare Sverige/))
  it('kontakt', () => rendersH1(Kontakt, /Kontakt/))
  it('uppforandekod', () => rendersH1(Uppforandekod, /Uppförandekod/))
})
