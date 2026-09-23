import {
  assignmentIdFrom,
  createGigProxy,
} from '../../../../lib/gig-proxy.server'

// GET: the public listing for the manage page. DELETE: withdraw it.
export default createGigProxy({
  methods: ['GET', 'DELETE'],
  path: (query) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}`
  },
})
