import type { NextPage } from 'next'
import Seo from '../../components/Seo'
import { getRoute } from '../../lib/routes'
import AnsokanFaq from './AnsokanFaq'
import RequestSlackInvitationForm from './RequestSlackInvitationForm'

const Ansokan: NextPage = () => {
  const meta = getRoute('/ansokan')!
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={meta.path} />

      <RequestSlackInvitationForm />
      <AnsokanFaq />
    </>
  )
}

export default Ansokan
