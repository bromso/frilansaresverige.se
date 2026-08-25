# FrilansareSverige.se

This is the Git repo for the page https://frilansaresverige.se/

## Getting Started with development

This is a [Next.js](https://nextjs.org/) project.

To the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `apps/web/pages/index.tsx`. The page auto-updates as you edit the file.

Nothing else is required to render the site, but copy `.env.example` to
`apps/web/.env.local` if you need the membership form or analytics — it
documents all three variables and what silently changes without them.

### Working in a container

`.devcontainer/` is set up for VS Code's Dev Containers extension: "Reopen in
Container" gives you Bun 1.3.14 and Node 24 with ports 3000, 6006 and 9229
forwarded. It is a development image only — production is built by the
`Dockerfile` at the repo root and served on `node:24-alpine`.

`deploy.sh` will not work from inside the container: it needs Docker on the
host plus SSH access to the deploy target.

### Tests

Run `bun test` **from the repo root**:

```bash
bun test
```

Running bare `bun test` from inside `apps/web` silently passes only half the
suite. `bunfig.toml`'s `preload` path resolves against the directory you
invoke from rather than the config file, so the happy-dom registration is
skipped and every test touching the DOM fails with `document is not defined`.
From inside a package, use `bun run test`, which passes the preload path
explicitly.

### Debugging

`.vscode/launch.json` has configurations for the server, the browser, both at
once, and attaching to a server running in a container. `bun run dev --inspect`
works from the root — the flag is forwarded through the workspace filter, and
`next dev` runs under real Node, so the standard inspector applies.

`bun test` is different: Bun implements the WebKit inspector protocol rather
than V8, so Chrome DevTools cannot attach. Use the `oven.bun-vscode`
extension, which the workspace recommends.

### Component library

Components live in `packages/ui`. Storybook is its own workspace app at
`apps/story`, with the stories under `apps/story/stories`:

```bash
bun run storybook
```

`apps/story` is a dev-only harness — it is not deployed. It carries its own
Tailwind entry (`apps/story/styles/storybook.css`) with the brand theme and a
`@source` directive pointing at `packages/ui`, without the web app's
page furniture (the decorative blobs and sticky-footer height chain).

After running `shadcn add` inside `packages/ui`, rewrite any emitted `@/…`
imports to relative paths — Next resolves `@/…` against `apps/web`, not
against `packages/ui`, so those imports would silently break.

## Contributions

Bring your ideas to #frilansaresverigese in our Slack.

Fork & pull request - make sure to attach a screenshot of the effect of your change so it is easy to review 👍
