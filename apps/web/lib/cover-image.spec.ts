import { beforeAll, describe, expect, test } from 'bun:test'
import { COVER_SIZES_TILE, coverImageProps } from './cover-image'

describe('coverImageProps', () => {
  // Outside production, next/image resolves the generated src against
  // window.location for its duplicate-image warning — happy-dom starts
  // at about:blank, which is not a valid base URL.
  beforeAll(() => {
    ;(
      window as unknown as { happyDOM: { setURL: (url: string) => void } }
    ).happyDOM.setURL('http://localhost/')
  })

  test('routes the cover through the image optimizer with a width ladder', () => {
    const props = coverImageProps(
      '/images/nyheter/example.jpg',
      COVER_SIZES_TILE,
    )
    expect(props.src).toMatch(
      /^\/_next\/image\?url=%2Fimages%2Fnyheter%2Fexample\.jpg&w=\d+&q=75$/,
    )
    expect(props.sizes).toBe(COVER_SIZES_TILE)
    const widths = (props.srcSet ?? '').match(/ (\d+)w/g) ?? []
    expect(widths.length).toBeGreaterThan(3)
  })
})
