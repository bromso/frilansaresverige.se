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
  props: await loadSida('villkor'),
})

const Villkor = (props: Props) => {
  const route = requireRoute('/villkor')
  return (
    <SectionedPage
      path="/villkor"
      title={route.title}
      description={route.description}
      {...props}
    />
  )
}

export default Villkor
