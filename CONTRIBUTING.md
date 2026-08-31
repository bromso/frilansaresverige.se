# Contributing

Thanks for wanting to help build the community's site! The best place to
discuss ideas before writing code is `#frilansaresverigese` in the community
Slack — or an issue here.

## Getting set up

```bash
bun install
bun run dev
```

That's it — nothing else is required to render the site. Copy
`.env.example` to `apps/web/.env.local` only if you need the forms or
analytics locally. The [README](README.md) covers the monorepo layout, the
devcontainer, Storybook and debugging in detail.

## Before you open a PR

Run the same checks CI runs, from the **repo root**:

```bash
bun run check:fix   # Biome lint + format
bun test            # the whole suite (root only — see README for why)
bun run build       # production build must pass
```

## Pull requests

- **Attach a screenshot** (or short recording) of the visual effect of your
  change — the review culture here is "show, don't tell" 👍
- Keep PRs focused. A PR that does one thing well merges fast.
- Commit messages follow the repo's style: `type(scope): lowercase summary`
  — e.g. `feat(web): event archive page`, `fix(ui): sync stepper pill`,
  `docs: rewrite readme`. Look at `git log --oneline` and match it.

## What kind of contribution is this?

**Content** (posts, events, static pages): everything under
`apps/web/content/` is MDX with validated frontmatter — the README's
"Writing content" section lists the directories and the two rules the
loaders enforce (quote your dates; roles/categories come from fixed sets).
Content PRs don't need design discussion, just correct frontmatter —
`bun test` validates every file on disk.

**Bug fixes**: a failing test that reproduces the bug, then the fix, is the
ideal shape.

**New features or visual changes**: raise them in Slack or an issue first.
Bigger changes get a short design doc in `docs/superpowers/specs/` before
implementation — see the existing specs for the format.

**Components**: shared UI lives in `packages/ui` with stories in
`apps/story`. Mind the `shadcn add` import caveat in the README.

## Code style

Biome is the only authority — `bun run check:fix` and you're done. A few
repo conventions worth knowing:

- Comments explain constraints the code can't show, not what the next line
  does.
- Swedish for all user-facing copy; English for code and comments.
- Pages register in `apps/web/lib/routes.ts` — that's what puts them in the
  nav, footer, sitemap and breadcrumbs.

## Code of conduct

The community's [uppförandekod](https://frilansaresverige.se/uppforandekod)
applies here too — see [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md).
