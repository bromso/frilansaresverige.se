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

Components live in `packages/ui` and are catalogued in Storybook:

```bash
bun run storybook
```

After running `shadcn add` inside `packages/ui`, rewrite any emitted `@/…`
imports to relative paths — Next resolves `@/…` against `apps/web`, not
against `packages/ui`, so those imports would silently break.

## Contributions

Bring your ideas to #frilansaresverigese in our Slack.

Fork & pull request - make sure to attach a screenshot of the effect of your change so it is easy to review 👍
