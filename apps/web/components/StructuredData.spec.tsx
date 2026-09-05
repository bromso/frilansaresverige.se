import { describe, expect, it } from 'bun:test'
import { serializeJsonLd } from './StructuredData'

describe('serializeJsonLd', () => {
  it('escapes < so a closing script tag cannot break out', () => {
    const json = serializeJsonLd({ name: 'a</script><script>alert(1)' })
    expect(json).not.toContain('</script>')
    expect(json).toContain('\\u003c/script>')
    expect(JSON.parse(json)).toEqual({ name: 'a</script><script>alert(1)' })
  })
})
