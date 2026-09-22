import { useCallback, useEffect, useState } from 'react'
import type {
  AssignmentView,
  CommentView,
} from '../components/AssignmentPreview'
import { postForm, SubmitError } from './submit-form'

export interface LoadedAssignment extends AssignmentView {
  id: string
}

export type AssignmentStatus = 'loading' | 'ready' | 'missing' | 'error'

const readJson = async (
  response: Response,
): Promise<Record<string, unknown>> => {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

const failed = (response: Response, payload: Record<string, unknown>) =>
  new SubmitError(
    typeof payload.error === 'string'
      ? payload.error
      : `Request failed with status ${response.status}`,
    response.status,
  )

/** The public listing, null when unknown, with a deleted one flattened. */
export async function fetchAssignment(
  id: string,
): Promise<LoadedAssignment | null> {
  const response = await fetch(`/api/uppdrag/assignments/${id}`)
  if (response.status === 404) {
    return null
  }
  const payload = await readJson(response)
  if (!response.ok) {
    throw failed(response, payload)
  }
  if (payload.deleted === true) {
    return {
      id,
      title: String(payload.title ?? ''),
      description: '',
      customerName: '',
      location: null,
      scope: null,
      workForm: null,
      contact: '',
      senderType: 'DIRECT',
      clientHourlyRate: null,
      deleted: true,
    }
  }
  return { ...(payload as unknown as LoadedAssignment), id, deleted: false }
}

export async function fetchComments(id: string): Promise<CommentView[]> {
  const response = await fetch(`/api/uppdrag/assignments/${id}/comments`)
  const payload = await response.json()
  if (!response.ok || !Array.isArray(payload)) {
    throw new SubmitError(
      `Request failed with status ${response.status}`,
      response.status,
    )
  }
  return (payload as CommentView[]).slice().sort((a, b) => a.id - b.id)
}

// State for /tipsa/hantera/[id]: the listing, its comments, and the two
// mutations, each of which reloads so the page shows what the service
// has rather than what it optimistically assumed.
export const useAssignment = (id: string | undefined) => {
  const [assignment, setAssignment] = useState<LoadedAssignment | null>(null)
  const [comments, setComments] = useState<CommentView[]>([])
  const [status, setStatus] = useState<AssignmentStatus>('loading')

  const reload = useCallback(async () => {
    if (!id) {
      return
    }
    setStatus('loading')
    try {
      const loaded = await fetchAssignment(id)
      if (loaded === null) {
        setAssignment(null)
        setStatus('missing')
        return
      }
      setAssignment(loaded)
      setComments(loaded.deleted ? [] : await fetchComments(id))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  const addComment = async (comment: string) => {
    if (!id) {
      return
    }
    await postForm(`/api/uppdrag/assignments/${id}/comments`, { comment })
    setComments(await fetchComments(id))
  }

  const remove = async () => {
    if (!id) {
      return
    }
    const response = await fetch(`/api/uppdrag/assignments/${id}`, {
      method: 'DELETE',
    })
    const payload = await readJson(response)
    if (!response.ok || payload.success !== true) {
      throw failed(response, payload)
    }
    await reload()
  }

  return { assignment, comments, status, reload, addComment, remove }
}
