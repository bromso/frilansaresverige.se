import {
  assignmentIdFrom,
  createUppdragProxy,
} from '../../../../../lib/uppdrag-proxy.server'

// GET: the kompletteringar. POST: add one.
export default createUppdragProxy({
  methods: ['GET', 'POST'],
  path: (query) => {
    const id = assignmentIdFrom(query)
    return id && `/api/assignments/${id}/comments`
  },
})
