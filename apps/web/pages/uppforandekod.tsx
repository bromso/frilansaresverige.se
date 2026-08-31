import type { GetStaticProps } from 'next'
import SectionedPage, {
  type SerializedSection,
} from '../components/SectionedPage'
import type { SidaMeta } from '../lib/content'
import { getRoute } from '../lib/routes'
import { loadSida } from '../lib/sidor.server'

interface Props {
  meta: SidaMeta
  sections: SerializedSection[]
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: await loadSida('uppforandekod'),
})

const Uppforandekod = (props: Props) => {
  const route = getRoute('/uppforandekod')!
  return (
    <SectionedPage
      path="/uppforandekod"
      title={route.title}
      description={route.description}
      {...props}
    />
  )
}

export default Uppforandekod
