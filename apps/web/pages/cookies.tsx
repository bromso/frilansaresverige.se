import type { GetStaticProps } from 'next'
import SectionedPage, {
  type SerializedSection,
} from '../components/SectionedPage'
import type { SidaMeta } from '../lib/content'
import { requireRoute } from '../lib/routes'
import { loadSida } from '../lib/sidor.server'

interface Props {
  meta: SidaMeta
  sections: SerializedSection[]
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: await loadSida('cookies'),
})

const Cookies = (props: Props) => {
  const route = requireRoute('/cookies')
  return (
    <SectionedPage
      path="/cookies"
      title={route.title}
      description={route.description}
      {...props}
    />
  )
}

export default Cookies
