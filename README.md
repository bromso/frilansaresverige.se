# frilansaresverige.se

The website for [Frilansare Sverige](https://frilansaresverige.se/) — Sweden's largest freelancer community. Community-run, no middlemen, and open source: the site is built by its members in the open.

[![Next.js](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/next?filename=apps%2Fweb%2Fpackage.json&logo=nextdotjs&logoColor=white&label=Next.js&color=000000)](https://nextjs.org/)
[![React](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/react?filename=apps%2Fweb%2Fpackage.json&logo=react&logoColor=white&label=React&color=087ea4)](https://react.dev/)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/dev/typescript?filename=apps%2Fweb%2Fpackage.json&logo=typescript&logoColor=white&label=TypeScript&color=3178c6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/dev/tailwindcss?filename=apps%2Fweb%2Fpackage.json&logo=tailwindcss&logoColor=white&label=Tailwind&color=06b6d4)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/motion?filename=packages%2Fui%2Fpackage.json&logo=framer&logoColor=white&label=Motion&color=fff42b&logoSize=auto)](https://motion.dev/)
[![MDX](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/next-mdx-remote?filename=apps%2Fweb%2Fpackage.json&logo=mdx&logoColor=white&label=MDX&color=1b1f24)](https://mdxjs.com/)
[![Storybook](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/dev/storybook?filename=apps%2Fstory%2Fpackage.json&logo=storybook&logoColor=white&label=Storybook&color=ff4785)](https://storybook.js.org/)
[![Biome](https://img.shields.io/github/package-json/dependency-version/frilansaresverige/frilansaresverige.se/dev/@biomejs/biome?logo=biome&logoColor=white&label=Biome&color=60a5fa)](https://biomejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-workspaces-f9f1e1?logo=bun&logoColor=14151a)](https://bun.sh/)
[![Docker](https://img.shields.io/badge/Docker-standalone-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![Last commit](https://img.shields.io/github/last-commit/frilansaresverige/frilansaresverige.se?label=last%20commit&color=4823dc)](https://github.com/frilansaresverige/frilansaresverige.se/commits/)

## What this is

A statically generated Next.js site (Pages Router) serving the community's public face: who we are, how membership works, gig tips for companies, news, events, gig listings and community reviews. Forms post directly to the community Slack via webhooks — there is no database.

## Monorepo layout

Bun workspaces, no extra build orchestrator:

```
apps/
  web/          The Next.js site (pages router, statically generated)
    content/    MDX content: nyheter, event, uppdrag, recensioner, sidor
    lib/        routes registry, content loaders, sitemap/llms builders
  story/        Storybook harness for the component library (dev-only)
packages/
  ui/           Shared components: shadcn/radix ui, vendored animate-ui, brand theme
  tsconfig/     Shared TypeScript configs
```

Two files are worth knowing before anything else:

- **`apps/web/lib/routes.ts`** is the single source of truth for the information architecture. Nav tabs, footer, breadcrumbs, sitemap.xml, llms.txt and the 404 page all render from it — registering a page there is what makes it exist site-wide.
- **`apps/web/lib/content.ts`** (+ `content.server.ts`) drives everything under `apps/web/content/`: frontmatter parsing and validation, sorting, and the section splitting used by the scrollspy pages.

## Getting started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Nothing else is required to render the site, but copy `.env.example` to `apps/web/.env.local` if you need the membership form or analytics — it documents all three variables and what silently changes without them.

### Working in a container

`.devcontainer/` is set up for VS Code's Dev Containers extension: "Reopen in Container" gives you Bun and Node 24 with ports 3000, 6006 and 9229 forwarded. It is a development image only — production is built by the `Dockerfile` at the repo root and served on `node:24-alpine`.

`deploy.sh` will not work from inside the container: it needs Docker on the host plus SSH access to the deploy target.

## Writing content

All editorial content is MDX with YAML frontmatter in `apps/web/content/`. The filename is the slug; adding a file is publishing.

| Directory | Renders at | Notes |
| --- | --- | --- |
| `nyheter/` | `/nyheter`, `/nyheter/[slug]` | Newsroom-style posts. Optional `image` gets a brand duotone treatment. |
| `event/` | `/event`, `/event/[slug]` | Upcoming/past split happens at build time. |
| `uppdrag/` | `/uppdrag`, `/uppdrag/[slug]` | Gig listings; `role` must be one of the fixed set in `GIG_ROLES`. |
| `recensioner/` | `/recensioner`, `/recensioner/[slug]` | Company reviews; the overall score is computed from the three criteria, never authored. |
| `sidor/` | `/cookies`, `/villkor`, … | Long-form static pages; `##` headings become scrollspy sections. |

Two rules the loaders enforce (with helpful errors):

- **Quote dates in frontmatter** (`date: "2026-08-29"`). Unquoted YAML dates parse as UTC `Date` objects and silently shift event times.
- **Fixed sets are fixed.** Gig roles and review categories validate against the exported constants in `lib/content.ts`, so a typo fails `bun test` instead of rendering a broken filter chip.

## Tests

Run `bun test` **from the repo root**:

```bash
bun test
```

Running bare `bun test` from inside `apps/web` silently passes only half the suite. `bunfig.toml`'s `preload` path resolves against the directory you invoke from rather than the config file, so the happy-dom registration is skipped and every test touching the DOM fails with `document is not defined`. From inside a package, use `bun run test`, which passes the preload path explicitly.

Linting and formatting is Biome:

```bash
bun run check       # report
bun run check:fix   # fix in place
```

## Component library

Components live in `packages/ui`. Storybook is its own workspace app at `apps/story`, with the stories under `apps/story/stories`:

```bash
bun run storybook
```

`apps/story` is a dev-only harness — it is not deployed. It carries its own Tailwind entry (`apps/story/styles/storybook.css`) with the brand theme and a `@source` directive pointing at `packages/ui`, without the web app's page furniture (the decorative blobs and sticky-footer height chain).

After running `shadcn add` inside `packages/ui`, rewrite any emitted `@/…` imports to relative paths — Next resolves `@/…` against `apps/web`, not against `packages/ui`, so those imports would silently break.

## Debugging

`.vscode/launch.json` has configurations for the server, the browser, both at once, and attaching to a server running in a container. `bun run dev --inspect` works from the root — the flag is forwarded through the workspace filter, and `next dev` runs under real Node, so the standard inspector applies.

`bun test` is different: Bun implements the WebKit inspector protocol rather than V8, so Chrome DevTools cannot attach. Use the `oven.bun-vscode` extension, which the workspace recommends.

## Deployment

Production is a standalone Next.js build in Docker (`node:24-alpine`), shipped by `deploy.sh`: it builds for `linux/amd64`, streams the image over SSH and restarts the compose service on the server. Note for anything that reads files at request time (like the sitemap reading `content/`): the standalone output only includes what's traced, so such paths must be listed in `outputFileTracingIncludes` in `next.config.js`.

## Design docs

Bigger changes are designed before they are built. Specs live in `docs/superpowers/specs/` and implementation plans in `docs/superpowers/plans/` — the information architecture and the monorepo migration are both documented there.

## Contributing

Bring your ideas to `#frilansaresverigese` in our Slack, or open an issue.

Fork & pull request — attach a screenshot of the effect of your change so it is easy to review 👍
