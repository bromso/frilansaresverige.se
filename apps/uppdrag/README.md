# @frilansaresverige/uppdrag

The service behind publishing gigs on frilansaresverige.se/tipsa and
uppdrag.frilansaresverige.se. A single Bun process: `Bun.serve` routes,
`Bun.SQL` against MySQL, `fetch` against the Slack Web API, nodemailer for
the receipt mail.

What it does: stores a published gig, posts it to the broker or direct
Slack channel (a message plus a thread reply with the description), emails
the sender a secret manage link, posts later "kompletteringar" as broadcast
replies, and on deletion rewrites every Slack message. Anything that never
reached Slack is retried on startup. It also serves the Slack member count
the homepage shows.

## Endpoints

| Route | Auth | Notes |
|---|---|---|
| `POST /api/assignments` | bearer key | `201 { success, id }`; the body is validated in `src/validate.ts` |
| `GET /api/assignments/:id` | bearer key | public fields, or `{ id, title, deleted: true }` |
| `DELETE /api/assignments/:id` | bearer key | soft delete |
| `GET`/`POST /api/assignments/:id/comments` | bearer key | list, add |
| `GET /api/health` | open | 200 when MySQL answers |
| `GET /api/member-count` | open | `text/plain`, 503 until the first refresh |
| `GET /assignments/:id`, `GET /` | open | 301 to the site (old receipt links) |

The key is `UPPDRAG_API_KEY`; apps/web sends it and is the only caller.
The site's honeypot and rate limit live in its proxy
(`apps/web/lib/uppdrag-proxy.server.ts`).

## Running it locally

```bash
docker compose -f apps/uppdrag/compose.yml up -d   # MySQL 8 with schema.sql applied
cp apps/uppdrag/.env.example apps/uppdrag/.env      # fill it in
bun run dev:uppdrag                                 # http://localhost:8989
```

Point the site at it with `UPPDRAG_API_URL=http://localhost:8989` and the
same `UPPDRAG_API_KEY` in `apps/web/.env.local`.

Tests: `bun test apps/uppdrag`. The database spec runs only when
`MYSQL_URL` is set:

```bash
MYSQL_URL=mysql://uppdrag:uppdrag@127.0.0.1:3306/uppdrag?sslmode=require bun test apps/uppdrag/src/db.spec.ts
```

The `?sslmode=require` parameter is required because Bun's SQL mysql
adapter refuses MySQL 8's default `caching_sha2_password` auth plugin over
a plaintext connection (see `compose.yml`).

## Deploying

`deploy.sh` at the repo root builds `frilansaresverige-uppdrag` from
`apps/uppdrag/Dockerfile` (context: repo root) alongside the web image and
ships both. On the server the compose file needs, once:

```yaml
services:
  uppdrag:
    image: frilansaresverige-uppdrag:latest
    restart: unless-stopped
    env_file: uppdrag.env          # the variables in .env.example
  web:
    environment:
      UPPDRAG_API_URL: http://uppdrag:8989
      UPPDRAG_API_KEY: ${UPPDRAG_API_KEY}
```

and the reverse proxy routes uppdrag.frilansaresverige.se to the `uppdrag`
service on 8989.

### Cutover (first deploy)

Do these in order:

1. Build `apps/uppdrag/Dockerfile` locally and start it once against a
   scratch env before anything touches the server:
   `docker build -t frilansaresverige-uppdrag -f apps/uppdrag/Dockerfile .`,
   then `docker run --rm -p 8989:8989 --env-file <scratch env> frilansaresverige-uppdrag`
   and `curl http://localhost:8989/api/health`.
2. Confirm the production MySQL accepts `?sslmode=require` in `MYSQL_URL`,
   or configure a user with `mysql_native_password` instead of the
   `caching_sha2_password` default. Then apply the last `ALTER TABLE` block
   at the end of `apps/uppdrag/schema.sql` by hand; the earlier statements
   are already in place.
3. Inspect the rows the startup sync would post:
   `SELECT id, created, deleted FROM assignment WHERE slackId IS NULL`.
   Delete or mark any stale ones. The service skips deleted rows, but old
   undeleted failures will be posted.
4. On the server: write `uppdrag.env` from `apps/uppdrag/.env.example` with
   the production values, add the compose service and the two web env vars
   (above), point the reverse proxy for uppdrag.frilansaresverige.se at the
   `uppdrag` service on 8989, and confirm the proxy overwrites
   `X-Forwarded-For` rather than appending to it (the rate limiter trusts
   the first hop).
5. Stop and remove the old bot container, so two processes never share the
   database or both run the startup sync.
6. Run `./deploy.sh` from the repo root (it loads both images before
   `docker compose up`).
7. Parity check against production: publish as broker and as direct on
   /tipsa; the message and thread land in the right channel; the receipt
   arrives; the manage link works; add a komplettering; delete; every Slack
   message is rewritten to "raderats"; one old receipt link on the old
   domain redirects (take the real link format from an old mail); a legacy
   row with only `contact` set renders on the manage page; the homepage
   member count renders.
