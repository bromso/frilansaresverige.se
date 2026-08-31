import type { ItemList, WithContext } from 'schema-dts'
import { SITE_URL } from './Seo'
import StructuredData from './StructuredData'

// ItemList JSON-LD for the archive pages (nyheter, event, uppdrag,
// recensioner): tells crawlers the page is an ordered collection and
// what it contains. Typed with schema-dts like all structured data on
// the site, so invalid shapes fail tsc.
const ItemListJsonLd = ({
  name,
  items,
}: {
  name: string
  items: { path: string; name: string }[]
}) => {
  const jsonLd: WithContext<ItemList> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  }
  return <StructuredData data={jsonLd} />
}

export default ItemListJsonLd
