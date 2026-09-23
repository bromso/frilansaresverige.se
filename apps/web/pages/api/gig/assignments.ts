import { createGigProxy } from '../../../lib/gig-proxy.server'

// POST: publish a listing. The body is the service's shape, mapped by
// hooks/useSubmitGigTipForm.ts.
export default createGigProxy({
  methods: ['POST'],
  path: () => '/api/assignments',
})
