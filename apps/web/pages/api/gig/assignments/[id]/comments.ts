import {
  assignmentIdFrom,
  createGigProxy,
} from '../../../../../lib/gig-proxy.server'

// GET: the kompletteringar. POST: add one.
export default createGigProxy({
  methods: ['GET', 'POST'],
  path: (query) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}/comments`
  },
})
