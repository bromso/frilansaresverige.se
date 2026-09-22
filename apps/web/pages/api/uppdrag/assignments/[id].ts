import {
  assignmentIdFrom,
  createUppdragProxy,
} from '../../../../lib/uppdrag-proxy.server'

// GET: the public listing for the manage page. DELETE: withdraw it.
export default createUppdragProxy({
  methods: ['GET', 'DELETE'],
  path: (query) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}`
  },
})
