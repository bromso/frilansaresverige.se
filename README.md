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
