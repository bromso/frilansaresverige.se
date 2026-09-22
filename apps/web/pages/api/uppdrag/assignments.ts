import { createUppdragProxy } from '../../../lib/uppdrag-proxy.server'

// POST: publish a listing. The body is the service's shape, mapped by
// hooks/useSubmitGigTipForm.ts.
export default createUppdragProxy({
  methods: ['POST'],
  path: () => '/api/assignments',
})
