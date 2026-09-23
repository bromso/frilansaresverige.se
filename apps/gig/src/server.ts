import { createHash, timingSafeEqual } from 'node:crypto'
import type { BunRequest } from 'bun'
import { type AssignmentHandlers, fail } from './assignments'
import type { Config } from './config'
import { manageURL } from './templates'

export interface ServerDeps {
  config: Pick<Config, 'apiKey' | 'siteUrl'>
  handlers: AssignmentHandlers
  isHealthy(): Promise<boolean>
  memberCount(): number | null
}

// The routes table for Bun.serve. Assignment endpoints require the shared
// key so the site's rate limiter and honeypot cannot be bypassed by calling
// the service directly; health, member-count and the redirects stay open.
export function createRoutes({
  config,
  handlers,
  isHealthy,
  memberCount,
}: ServerDeps) {
  const digest = (value: string) => createHash('sha256').update(value).digest()
  const expected = digest(`Bearer ${config.apiKey}`)
  // Hashing both sides gives equal-length buffers, so the comparison
  // cannot leak the key's length or a matching prefix.
  const authorized = (req: Request) =>
    timingSafeEqual(digest(req.headers.get('authorization') ?? ''), expected)

  const guarded =
    <P extends string>(handler: (req: BunRequest<P>) => Promise<Response>) =>
    (req: BunRequest<P>): Promise<Response> =>
      authorized(req)
        ? handler(req)
        : Promise.resolve(fail(401, 'Unauthorized'))

  return {
    '/api/assignments': {
      POST: guarded<'/api/assignments'>((req) => handlers.create(req)),
    },
    '/api/assignments/:id': {
      GET: guarded<'/api/assignments/:id'>((req) =>
        handlers.get(req.params.id),
      ),
      DELETE: guarded<'/api/assignments/:id'>((req) =>
        handlers.remove(req.params.id),
      ),
    },
    '/api/assignments/:id/comments': {
      GET: guarded<'/api/assignments/:id/comments'>((req) =>
        handlers.listComments(req.params.id),
      ),
      POST: guarded<'/api/assignments/:id/comments'>((req) =>
        handlers.createComment(req.params.id, req),
      ),
    },
    '/api/health': {
      GET: async () =>
        new Response(null, { status: (await isHealthy()) ? 200 : 500 }),
    },
    '/api/member-count': {
      GET: () => {
        const count = memberCount()
        return count === null
          ? new Response(null, { status: 503 })
          : new Response(String(count), {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
      },
    },
    // Edit links in already-sent receipt mails point at the old domain.
    '/assignments/:id': {
      GET: (req: BunRequest<'/assignments/:id'>) =>
        Response.redirect(manageURL(config.siteUrl, req.params.id), 301),
    },
    '/': {
      GET: () => Response.redirect(`${config.siteUrl}/tipsa`, 301),
    },
  }
}
