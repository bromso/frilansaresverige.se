import type { Thing, WithContext } from 'schema-dts'

// Renders a schema.org JSON-LD block. The prop is typed with schema-dts
// (Google's TypeScript types for the schema.org vocabulary), so a typo'd
// @type or a property that doesn't exist on the schema fails `tsc`
// instead of silently shipping invalid structured data.
//
// `<` is escaped so a title containing "</script>" can never close the
// block early. The data is repo content, so this guards against a
// mistake rather than an attacker, but it is a one-line guarantee.
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')

const StructuredData = <T extends Thing>({
  data,
}: {
  data: WithContext<T>
}) => (
  <script
    type="application/ld+json"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized from statically typed registry data with < escaped, no user input.
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
  />
)

export default StructuredData
