// Shared POST helper for the two Slack-backed forms. The API answers
// `{ success: true }` on delivery and `{ success: false, error }` with a
// 4xx/5xx otherwise, so anything but an ok status with success set is
// surfaced as an error the form can show; before this the hooks only
// looked at the JSON and a 400/502 left the form silently stuck.

export interface FormResult {
  success: boolean
}

export class SubmitError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'SubmitError'
  }
}

export async function postForm(
  url: string,
  body: Record<string, string>,
): Promise<FormResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let payload: Partial<FormResult> & { error?: string } = {}
  try {
    payload = await response.json()
  } catch {
    // A non-JSON body (proxy error page, empty 502) is still a failure;
    // fall through with the status alone.
  }
  if (!response.ok || payload.success !== true) {
    throw new SubmitError(
      payload.error ?? `Request failed with status ${response.status}`,
      response.status,
    )
  }
  return { success: true }
}

/**
 * Reads a named control off the form element, tolerating plain-object
 * mock targets in unit tests (which have no `elements`).
 */
export const controlValue = (target: EventTarget, name: string): string => {
  const control = (target as unknown as Record<string, { value?: unknown }>)[
    name
  ]
  return typeof control?.value === 'string' ? control.value : ''
}
