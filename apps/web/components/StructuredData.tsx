import type { Thing, WithContext } from 'schema-dts'

// Renders a schema.org JSON-LD block. The prop is typed with schema-dts
// (Google's TypeScript types for the schema.org vocabulary), so a typo'd
// @type or a property that doesn't exist on the schema fails `tsc`
// instead of silently shipping invalid structured data.
const StructuredData = <T extends Thing>({
  data,
}: {
  data: WithContext<T>
}) => (
  <script
    type="application/ld+json"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized from statically typed registry data, no user input.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)

export default StructuredData
