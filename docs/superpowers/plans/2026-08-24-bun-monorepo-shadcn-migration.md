# Bun / Monorepo / shadcn Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `frilansaresverige.se` from an npm single-package Next.js app to a Bun workspace monorepo with a shared Tailwind v4 + shadcn/ui + animate-ui component library, catalogued in Storybook, linted by Biome, tested with `bun test`.

**Architecture:** Seven phases across eleven tasks, each independently buildable and revertable. Toolchain first (Bun, test runner, Biome), then structure (workspaces), then styling (Tailwind foundation with preflight *off*, then the rewrite with preflight *on*), then Storybook. The phase 5/6 split exists so shadcn/animate-ui land while the live site is provably unchanged.

**Tech Stack:** Bun 1.3.14, Next.js 16 (Pages Router), React 19, TypeScript 6, Tailwind CSS 4.3.3, shadcn 4.19.0, animate-ui (shadcn registry), Storybook 10.5.10 (`@storybook/nextjs-vite`), Biome 2.5.10, `bun test` + happy-dom.

**Spec:** `docs/superpowers/specs/2026-08-24-bun-monorepo-shadcn-migration-design.md`

## Global Constraints

- Branch `migrate/bun-monorepo-shadcn` is already checked out; the spec is committed there.
- Production runtime stays **Node** (`node:24-alpine`). Bun builds only. Never change `CMD` to `bun`.
- `.nvmrc` / `.node-version` stay at `v24`.
- Package names: `@frilansaresverige/web`, `@frilansaresverige/ui`, `@frilansaresverige/tsconfig`.
- Formatter settings must match the old `.prettierrc` exactly: `semicolons: "asNeeded"`, `quoteStyle: "single"`, `jsxQuoteStyle: "double"`, `indentWidth: 2`, `indentStyle: "space"`, `lineEnding: "lf"`.
- All UI copy is **Swedish**. Never translate existing strings. Never invent new user-facing copy.
- Brand palette, exact values: `--blue #4823dc`, `--white #fffce3`, `--coral #ff9c8e`, `--grey #333333`, `--dark-blue #2601bb`, `--light-coral #ffcfc8`.
- All animate-ui motion must be gated on `prefers-reduced-motion`.
- No Turborepo. No second app. Do not delete `pages/api/hello.ts`.
- Never commit `node_modules`, `.next`, `storybook-static`.
- Dependency versions to pin (verified 2026-08-24):
  `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3`, `@biomejs/biome@2.5.10`,
  `storybook@10.5.10`, `@storybook/nextjs-vite@10.5.10`, `@storybook/addon-docs@10.5.10`,
  `@happy-dom/global-registrator@20.11.6`, `tailwind-merge@3.6.0`, `clsx@2.1.1`,
  `class-variance-authority@0.7.1`, `motion@13.1.1`, `vite@8.2.2`.

---

## File Structure

**Created:**
- `bunfig.toml` — bun test preload config
- `.bun-version` — pins Bun
- `biome.json` — the single lint/format config
- `test-setup.ts` — registers happy-dom globals
- `apps/web/**` — the existing app, relocated
- `packages/tsconfig/{base,nextjs,react-library}.json` — shared compiler config
- `packages/ui/src/lib/utils.ts` — `cn()`
- `packages/ui/src/styles/theme.css` — `@theme` brand tokens
- `packages/ui/src/ui/*` — shadcn primitives
- `packages/ui/src/animate-ui/*` — animate-ui components
- `apps/web/.storybook/{main,preview}.ts`

**Deleted:**
- `package-lock.json`, `jest.config.mjs`, `jest.setup.ts`, `eslint.config.mjs`, `.prettierrc`
- `styles/Home.module.css`, `pages/ansokan/RequestSlackInvitationForm.module.css`
- Most of `styles/globals.css` (blobs + height chain survive)

**Responsibility boundaries:** `packages/ui` is presentation only — no routing, no data fetching, no Slack knowledge. If adding the second app later requires editing `packages/ui` for anything but adding a component, the boundary is wrong.

---

### Task 1: Bun adoption

**Files:**
- Modify: `package.json`, `Dockerfile`, `.envrc`, `.gitignore`, `.dockerignore`, `README.md`
- Create: `.bun-version`
- Delete: `package-lock.json`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `bun.lock` at repo root; `bun run build` / `bun run dev` / `bun run test` as the canonical scripts. Docker image name stays `frilansaresverige-website`.

- [ ] **Step 1: Record the current build as a baseline**

```bash
npm ci && npm run build 2>&1 | tail -20
```
Expected: build succeeds. Note the route list Next prints — Task 4 compares against it.

- [ ] **Step 2: Remove npm lockfile and install with Bun**

```bash
rm package-lock.json
bun install
```
Expected: `bun.lock` is created. `node_modules/` repopulates.

- [ ] **Step 3: Pin the Bun version**

Create `.bun-version`:
```
1.3.14
```

- [ ] **Step 4: Update `.gitignore` and `.dockerignore`**

Append to `.gitignore`:
```
# storybook
storybook-static/
```

In `.dockerignore`, add on their own lines:
```
storybook-static
docs
```

- [ ] **Step 5: Rewrite the Dockerfile deps and builder stages**

Replace the first two stages of `Dockerfile`. The runner stage is **unchanged** — it stays `node:24-alpine`:

```dockerfile
# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build
```

- [ ] **Step 6: Update `.envrc` to prefer Bun's binaries**

Replace `.envrc` with:
```bash
#!/bin/bash

nvmrc=~/.nvm/nvm.sh
if [ -e $nvmrc ]; then
    source $nvmrc
    nvm use
fi

PATH_add node_modules/.bin
```
(unchanged — `node_modules/.bin` is still where Bun links binaries; this step is a no-op confirmation, do not edit the file)

- [ ] **Step 7: Update README install instructions**

In `README.md`, replace the `npm run dev` fenced block with:
````
```bash
bun install
bun run dev
```
````

- [ ] **Step 8: Verify the build passes under Bun**

```bash
bun run build 2>&1 | tail -20
```
Expected: same route list as Step 1.

- [ ] **Step 9: Verify the Docker image still builds and serves**

```bash
docker build -t frilansaresverige-website:bun-test .
docker run --rm -d -p 3001:3000 --name fs-smoke frilansaresverige-website:bun-test
sleep 3
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/ansokan
docker rm -f fs-smoke
```
Expected: both print `200`. If either fails, stop — do not proceed to Task 2.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "build: adopt bun as package manager and build toolchain

Replaces npm/package-lock.json with bun/bun.lock. Docker deps and
builder stages move to oven/bun:1-alpine; the runner stage stays on
node:24-alpine so the production serving path is unchanged."
```

---

### Task 2: Migrate the test suite to `bun test`

**Files:**
- Modify: `hooks/useSubmitSlackInvitationForm.spec.ts`, `package.json`, `tsconfig.json`
- Create: `bunfig.toml`, `test-setup.ts`
- Delete: `jest.config.mjs`, `jest.setup.ts`

**Interfaces:**
- Consumes: Bun from Task 1
- Produces: `bun test` as the test command; `test-setup.ts` registering happy-dom globals for every test file.

- [ ] **Step 1: Add the DOM registrator dependency**

```bash
bun add -d @happy-dom/global-registrator@20.11.6
bun remove jest jest-environment-jsdom @types/jest
```

- [ ] **Step 2: Create the test setup preload**

Create `test-setup.ts`:
```ts
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

await import('@testing-library/jest-dom')
```

- [ ] **Step 3: Create `bunfig.toml`**

```toml
[test]
preload = ["./test-setup.ts"]
```

- [ ] **Step 4: Run the suite and watch it fail**

```bash
bun test 2>&1 | tail -30
```
Expected: FAIL — `jest is not defined` in the spec file, because `bun test` does not expose `jest` as a bare global.

- [ ] **Step 5: Add the explicit `bun:test` import to the spec**

At the very top of `hooks/useSubmitSlackInvitationForm.spec.ts`, above the existing imports, add:
```ts
import { describe, it, expect, afterAll, jest } from 'bun:test'
```
Change nothing else in the file. `jest.fn()`, `.mockImplementation()`, and `jest.clearAllMocks()` all exist on Bun's compat object.

- [ ] **Step 6: Run the suite and verify it passes**

```bash
bun test 2>&1 | tail -30
```
Expected: PASS — 4 tests across 1 file:
`should render with default values`, `should handle successful submission`,
`should handle submission failure`, `should handle submission error`.

- [ ] **Step 7: Delete the Jest configuration**

```bash
rm jest.config.mjs jest.setup.ts
```

- [ ] **Step 8: Point the test script at Bun**

In `package.json`, change the `test` script:
```json
"test": "bun test"
```

- [ ] **Step 9: Swap the TypeScript type definitions**

In `tsconfig.json`, change `compilerOptions.types` from `["node", "jest"]` to:
```json
"types": ["node", "bun"]
```
And in `include`, replace `"./jest.setup.ts"` with `"./test-setup.ts"`.

- [ ] **Step 10: Verify types and build still pass**

```bash
bunx tsc --noEmit && bun run build 2>&1 | tail -5
```
Expected: no type errors; build succeeds.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "test: migrate from jest to bun test

Uses bun:test's jest compatibility object so the existing spec keeps its
jest.fn() mocks. happy-dom is registered via bunfig preload to give
renderHook a DOM. All four test cases are semantically unchanged."
```

---

### Task 3: Replace ESLint and Prettier with Biome

**Files:**
- Create: `biome.json`
- Modify: `package.json`, every `.ts`/`.tsx` file (import ordering)
- Delete: `eslint.config.mjs`, `.prettierrc`

**Interfaces:**
- Consumes: Bun from Task 1
- Produces: `bun run check` (verify) and `bun run check:fix` (write) as the lint/format commands.

- [ ] **Step 1: Swap the dependencies**

```bash
bun remove eslint eslint-config-next eslint-plugin-testing-library prettier
bun add -d @biomejs/biome@2.5.10
```

- [ ] **Step 2: Create `biome.json` preserving the old Prettier settings**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.10/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "includes": [
      "**",
      "!**/node_modules/**",
      "!**/.next/**",
      "!**/storybook-static/**",
      "!**/bun.lock"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "semicolons": "asNeeded",
      "quoteStyle": "single",
      "jsxQuoteStyle": "double"
    }
  },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

- [ ] **Step 3: Delete the old configs**

```bash
rm eslint.config.mjs .prettierrc
```

- [ ] **Step 4: Replace the lint/format scripts**

In `package.json`, remove `prettier:check`, `prettier:write`, and `lint`. Add:
```json
"check": "biome check .",
"check:fix": "biome check --write ."
```

- [ ] **Step 5: See what Biome objects to before changing anything**

```bash
bun run check 2>&1 | tail -40
```
Expected: a list of formatting diffs (should be small — settings match the old Prettier) plus import-ordering assists.

- [ ] **Step 6: Apply the fixes**

```bash
bun run check:fix
```

- [ ] **Step 7: Review the diff for semantic changes**

```bash
git diff --stat
git diff -- pages/ hooks/
```
Expected: import reordering and whitespace only. **If any logic changed, revert that hunk** — Biome's safe fixes should not alter behaviour.

- [ ] **Step 8: Verify clean, then build and test**

```bash
bun run check && bun test 2>&1 | tail -5 && bun run build 2>&1 | tail -5
```
Expected: check reports no diagnostics; 4 tests pass; build succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: replace eslint and prettier with biome

Biome's formatter is configured to match the previous .prettierrc exactly,
so the formatting diff is minimal; the bulk of this change is import
ordering from the organizeImports assist.

Knowingly drops eslint-config-next's Next-specific rules and
eslint-plugin-testing-library, which have no Biome equivalent."
```

---

### Task 4: Restructure into a Bun workspace

**Files:**
- Create: `packages/tsconfig/{package.json,base.json,nextjs.json,react-library.json}`, `apps/web/package.json`, `apps/web/tsconfig.json`
- Modify: `package.json` (root), `next.config.js` → `apps/web/next.config.js`, `Dockerfile`, `biome.json`
- Move: `pages/`, `hooks/`, `public/`, `styles/`, `next-env.d.ts`, `next.config.js`, `tsconfig.build.json` → `apps/web/`

**Interfaces:**
- Consumes: Bun (Task 1), `bun test` (Task 2), Biome (Task 3)
- Produces: workspace packages `@frilansaresverige/web` and `@frilansaresverige/tsconfig`. Standalone output at `apps/web/.next/standalone`, entrypoint `apps/web/server.js`.

- [ ] **Step 1: Move the app into `apps/web`**

```bash
mkdir -p apps/web
git mv pages hooks public styles next-env.d.ts next.config.js tsconfig.build.json apps/web/
git mv tsconfig.json apps/web/tsconfig.json
```

- [ ] **Step 2: Create the shared tsconfig package**

Create `packages/tsconfig/package.json`:
```json
{
  "name": "@frilansaresverige/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-library.json"]
}
```

Create `packages/tsconfig/base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  }
}
```

Create `packages/tsconfig/nextjs.json`:
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "types": ["node", "bun"]
  }
}
```

Create `packages/tsconfig/react-library.json`:
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "types": ["node", "bun"]
  }
}
```

- [ ] **Step 3: Create the web app's package manifest**

Create `apps/web/package.json`. Move every `dependencies` and app-relevant `devDependencies` entry out of the root manifest into this one:
```json
{
  "name": "@frilansaresverige/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "bun test"
  },
  "dependencies": {
    "classnames": "^2.5.1",
    "next": "^16.2.9",
    "react": "^19.2.7",
    "react-cookie-consent": "^10.0.1",
    "react-dom": "^19.2.7"
  },
  "devDependencies": {
    "@frilansaresverige/tsconfig": "workspace:*",
    "@happy-dom/global-registrator": "20.11.6",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/bun": "^1.4.0",
    "@types/node": "^26.0.0",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "typescript": "^6.0.3"
  }
}
```

**Do not treat this list as authoritative over the live file.** Read the current root `package.json` and move what is actually there. Tasks 2 and 3 changed the dependency set after this plan was written — `@types/bun` came from Task 2, `@biomejs/biome` from Task 3. `@biomejs/biome` is the only devDependency that belongs at the workspace root (Step 4); everything else moves here. If the live file and this block disagree, the live file wins and you should say so in your report.

- [ ] **Step 4: Reduce the root manifest to a workspace root**

Replace `package.json` at the repo root:
```json
{
  "name": "frilansaresverige.se",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --filter '@frilansaresverige/web' dev",
    "build": "bun run --filter '@frilansaresverige/web' build",
    "start": "bun run --filter '@frilansaresverige/web' start",
    "test": "bun test",
    "check": "biome check .",
    "check:fix": "biome check --write ."
  },
  "overrides": {
    "postcss": "^8.5.10",
    "js-yaml": "^4.2.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.5.10"
  }
}
```

- [ ] **Step 5: Point the app tsconfig at the shared base**

Replace `apps/web/tsconfig.json`:
```json
{
  "extends": "@frilansaresverige/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/components/*": ["./components/*"],
      "@/pages/*": ["./pages/*"],
      "@/styles/*": ["./styles/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "../../test-setup.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Set `outputFileTracingRoot` — the load-bearing line**

In `apps/web/next.config.js`, add the tracing root so standalone output resolves against the monorepo root. Without this the Docker `COPY` paths break *silently* — the build succeeds and the container 404s:

```js
/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.githubassets.com',
      },
    ],
  },
}

module.exports = nextConfig
```

- [ ] **Step 7: Reinstall so workspace links resolve**

```bash
bun install
```
Expected: `bun.lock` updates; `node_modules/@frilansaresverige/tsconfig` is symlinked.

- [ ] **Step 8: Verify the build and locate the standalone entrypoint**

```bash
bun run build 2>&1 | tail -20
ls apps/web/.next/standalone/apps/web/server.js
```
Expected: build succeeds with the same route list as Task 1 Step 1, and `server.js` exists at that exact path. **If the path differs, adjust the Dockerfile COPY paths in the next step to match what actually exists** — do not guess.

- [ ] **Step 9: Update the Dockerfile for the workspace layout**

```dockerfile
# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 10: Build the image and smoke-test the container**

This is the gate that catches both workspace hazards — wrong `COPY` paths and incomplete Bun hoisting:

```bash
docker build -t frilansaresverige-website:ws-test .
docker run --rm -d -p 3001:3000 --name fs-smoke frilansaresverige-website:ws-test
sleep 3
curl -sf -o /dev/null -w "/ -> %{http_code}\n" http://localhost:3001/
curl -sf -o /dev/null -w "/ansokan -> %{http_code}\n" http://localhost:3001/ansokan
docker logs fs-smoke 2>&1 | tail -20
docker rm -f fs-smoke
```
Expected: both routes return `200`.

**If the build fails with missing modules**, Bun did not hoist everything to the root `node_modules`. Fix by replacing the builder stage's `COPY --from=deps` with a direct install:
```dockerfile
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile && bun run build
```

- [ ] **Step 11: Verify tests and lint still pass from the root**

```bash
bun test 2>&1 | tail -5 && bun run check
```
Expected: 4 tests pass; Biome reports no diagnostics.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "refactor: restructure into a bun workspace monorepo

Moves the site to apps/web and extracts packages/tsconfig. Sets
outputFileTracingRoot so Next's standalone output resolves against the
repo root, and repoints the Docker COPY paths and CMD accordingly.

Verified by building the image and smoke-testing both routes in the
container, since a wrong COPY path fails silently at runtime."
```

---

### Task 5: Tailwind foundation with preflight disabled

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/src/styles/theme.css`, `packages/ui/src/lib/utils.ts`, `apps/web/postcss.config.mjs`
- Modify: `apps/web/styles/globals.css`, `apps/web/package.json`, `apps/web/next.config.js`

**Interfaces:**
- Consumes: workspace layout from Task 4
- Produces: `@frilansaresverige/ui` package exporting `./styles/theme.css` and `cn` from `./lib/utils`. Tailwind utilities available in `apps/web` **without** preflight.

- [ ] **Step 1: Create the UI package manifest**

Create `packages/ui/package.json`:
```json
{
  "name": "@frilansaresverige/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./styles/theme.css": "./src/styles/theme.css",
    "./lib/utils": "./src/lib/utils.ts",
    "./ui/*": "./src/ui/*.tsx",
    "./animate-ui/*": "./src/animate-ui/*.tsx"
  },
  "dependencies": {
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "3.6.0"
  },
  "devDependencies": {
    "@frilansaresverige/tsconfig": "workspace:*",
    "@types/react": "^19.2.17",
    "typescript": "^6.0.3"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

Create `packages/ui/tsconfig.json`:
```json
{
  "extends": "@frilansaresverige/tsconfig/react-library.json",
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Create the `cn` helper**

Create `packages/ui/src/lib/utils.ts`:
```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Create the brand theme**

Create `packages/ui/src/styles/theme.css`. The palette is a dark theme (blue ground, cream text) — the inverse of shadcn's light default — so `:root` *is* the brand theme. There is no `.dark` variant:

```css
@theme {
  --color-brand-blue: #4823dc;
  --color-brand-cream: #fffce3;
  --color-brand-coral: #ff9c8e;
  --color-brand-coral-light: #ffcfc8;
  --color-brand-blue-dark: #2601bb;
  --color-brand-grey: #333333;

  --color-background: var(--color-brand-blue);
  --color-foreground: var(--color-brand-cream);
  --color-card: var(--color-brand-cream);
  --color-card-foreground: var(--color-brand-blue);
  --color-primary: var(--color-brand-coral);
  --color-primary-foreground: var(--color-brand-grey);
  --color-border: var(--color-brand-blue);
  --color-input: var(--color-brand-cream);
  --color-ring: var(--color-brand-coral);

  --radius: 0.25rem;

  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}
```

- [ ] **Step 4: Install Tailwind into the web app**

```bash
cd apps/web
bun add -d tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3
bun add @frilansaresverige/ui@workspace:*
cd ../..
bun install
```

- [ ] **Step 5: Add the PostCSS config and enable workspace transpilation**

Create `apps/web/postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

Then add `transpilePackages` to `apps/web/next.config.js`, keeping the `outputFileTracingRoot` set in Task 4:

```js
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@frilansaresverige/ui'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.githubassets.com',
      },
    ],
  },
}
```

**Why this is required:** `@frilansaresverige/ui` exports raw `.ts`/`.tsx` from `src/`, and a workspace package resolves through a symlink into `node_modules`. Next.js does not transpile `node_modules` by default, so without this the first `packages/ui` import from `apps/web` fails to compile. Nothing imports the package until Task 8, so the failure would otherwise surface three tasks later, far from its cause.

- [ ] **Step 6: Wire Tailwind in with preflight OFF**

At the **very top** of `apps/web/styles/globals.css`, above the existing `:root` block, insert. Note this imports the theme and utilities layers but deliberately **omits** `preflight.css` — that is what keeps the existing CSS working:

```css
@layer theme, base, components, utilities;

@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '@frilansaresverige/ui/styles/theme.css';

@source '../../../packages/ui/src';
```

The `@source` line is **required**: Tailwind v4 does not scan linked workspace packages for class names, and without it every `packages/ui` component renders unstyled while the build still succeeds.

- [ ] **Step 7: Prove utilities work and preflight is genuinely off**

Temporarily add `className="underline"` to the `<p className="description">` element in `apps/web/pages/index.tsx`, then:
```bash
bun run dev
```
Open http://localhost:3000 and confirm: the description text is underlined (utilities work) **and** the page otherwise looks exactly as before — blue background, cream text, both decorative blobs bottom-right, coral buttons.

Then remove the temporary `underline` class.

- [ ] **Step 8: Verify the site is visually unchanged**

```bash
bun run build 2>&1 | tail -5 && bun run check && bun test 2>&1 | tail -5
```
Expected: all pass. The rendered site must look identical to before this task — a utilities stylesheet is added, but no existing rule is altered.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): add tailwind v4 foundation and packages/ui

Creates @frilansaresverige/ui with the brand palette mapped to shadcn
token names, plus the cn() helper. Tailwind is imported without
preflight so the existing CSS Modules keep working untouched; preflight
is enabled in the rewrite task.

The @source directive is required for Tailwind to scan the linked
workspace package."
```

---

### Task 6: Install shadcn and animate-ui components

**Files:**
- Create: `packages/ui/components.json`, `packages/ui/src/ui/{button,card,input,label,textarea,checkbox,alert}.tsx`, `packages/ui/src/animate-ui/**`
- Modify: `packages/ui/package.json`

**Interfaces:**
- Consumes: `cn` and the theme from Task 5
- Produces: importable components — `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Input`, `Label`, `Textarea`, `Checkbox`, `Alert`/`AlertDescription`, `Slide`, `SlidingNumber` (prop: `number: number`), and the animate-ui `Button` which becomes the app's canonical Button in Task 8 Step 7. **Record the real on-disk path and export signature of the animate-ui button in Step 5** — Tasks 8, 9 and 11 all import it.

- [ ] **Step 1: Configure shadcn with the animate-ui registry**

Create `packages/ui/components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/theme.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/",
    "ui": "@/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  },
  "registries": {
    "@animate-ui": "https://animate-ui.com/r/{name}.json"
  }
}
```

- [ ] **Step 2: Add a path alias so generated imports resolve**

In `packages/ui/tsconfig.json`, add to `compilerOptions`:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 3: Add the shadcn primitives**

```bash
cd packages/ui
bunx shadcn@4.19.0 add button card input label textarea checkbox alert
cd ../..
```
Expected: files appear under `packages/ui/src/ui/`. Radix dependencies (`@radix-ui/react-checkbox`, `@radix-ui/react-label`, `@radix-ui/react-slot`) are added to `packages/ui/package.json`.

- [ ] **Step 4: Add the animate-ui components**

```bash
cd packages/ui
bunx shadcn@4.19.0 add @animate-ui/primitives-texts-sliding-number
bunx shadcn@4.19.0 add @animate-ui/primitives-effects-slide
bunx shadcn@4.19.0 add @animate-ui/components-buttons-button
cd ../..
bun install
```
Expected: `motion` and `react-use-measure` are added as dependencies. Files land under `packages/ui/src/animate-ui/`.

- [ ] **Step 5: Verify the generated files reference the right paths**

```bash
grep -rn "@/lib/utils\|from 'motion" packages/ui/src | head -20
bunx tsc --noEmit -p packages/ui/tsconfig.json
```
Expected: no type errors. If imports point at a `components/animate-ui/...` path that does not exist, move the files under `packages/ui/src/animate-ui/` and fix the import specifiers to match.

- [ ] **Step 6: Add the reduced-motion guard hook**

Every animate-ui usage must respect `prefers-reduced-motion`. Create `packages/ui/src/lib/use-reduced-motion.ts`:
```ts
import { useEffect, useState } from 'react'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
```

Add it to the package exports in `packages/ui/package.json`:
```json
"./lib/use-reduced-motion": "./src/lib/use-reduced-motion.ts"
```

- [ ] **Step 7: Verify everything still builds and the site is unchanged**

```bash
bun run build 2>&1 | tail -5 && bun run check && bun test 2>&1 | tail -5
```
Expected: all pass. Nothing imports these components yet, so the site is still visually identical.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): add shadcn primitives and animate-ui components

Adds Button, Card, Input, Label, Textarea, Checkbox and Alert from
shadcn, plus SlidingNumber, Slide and the animate-ui button. Includes a
useReducedMotion hook so every animation can be gated.

Nothing consumes these yet; the site is unchanged."
```

---

### Task 7: Enable preflight and rewrite the app shell

**Files:**
- Modify: `apps/web/styles/globals.css`, `apps/web/pages/_app.tsx`

**Interfaces:**
- Consumes: theme and components from Tasks 5–6
- Produces: `globals.css` reduced to `@layer base` essentials; `_app.tsx` using Tailwind utilities.

- [ ] **Step 1: Capture baseline screenshots BEFORE flipping preflight**

This must happen before any visual change. Start the dev server and capture, at both widths, using the browser tools:
- `/` at 1440×900 and 390×844
- `/ansokan` at 1440×900 and 390×844

Save to `/tmp/fs-baseline/`. These are the reference for Task 10's comparison. **Do not skip this — once preflight is on, the baseline is unrecoverable without a git stash.**

- [ ] **Step 2: Enable preflight**

In `apps/web/styles/globals.css`, add the preflight import between the theme and utilities imports:
```css
@layer theme, base, components, utilities;

@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '@frilansaresverige/ui/styles/theme.css';

@source '../../../packages/ui/src';
```

- [ ] **Step 3: Reduce `globals.css` to only what utilities cannot express**

Replace everything *below* the imports in `apps/web/styles/globals.css` with the following. The blobs and the height chain survive because Tailwind has no utility form for pseudo-element geometry:

```css
@layer base {
  html,
  body {
    height: 100%;
    background: var(--color-brand-blue);
    color: var(--color-brand-cream);
    font-family: var(--font-sans);
    position: relative;
  }

  /* Next.js injects a #__next wrapper between body and the app tree;
     the sticky footer depends on this height chain. */
  body > div {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Decorative blobs. No utility equivalent — pseudo-element geometry. */
  body::before,
  body::after {
    content: '';
    background: var(--color-brand-blue-dark);
    width: 40em;
    height: 40em;
    position: fixed;
    bottom: 0;
    z-index: 0;
    transform: translateX(50%);
  }

  body::before {
    right: 0;
    border-radius: 50% 50% 0 0;
  }

  body::after {
    right: 40em;
    border-radius: 50%;
  }

  a {
    color: inherit;
  }
}
```

- [ ] **Step 4: Rewrite `_app.tsx` layout with utilities**

In `apps/web/pages/_app.tsx`, replace the `className` values. The resulting structure — the inline SVG logo and every Swedish string stay **byte-identical**, only classes change:

```tsx
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <div className="relative z-[2] mx-auto flex min-w-full flex-wrap gap-8 px-[min(2em,3vw)] pt-[4.5em] pb-8">
        <Link
          href="/"
          className="flex-[999_1_8em]"
          title="Gå till startsidan"
        >
          {/* inline SVG logo — copy across unchanged, do not re-draw */}
        </Link>
        <main className="relative z-[2] mr-auto flex flex-[1_1_40em] flex-col items-center justify-start">
          <Component {...pageProps} />
        </main>
        <div className="flex-[999_1_8em]" />
      </div>

      <footer className="relative z-[2] mt-auto w-full py-8 text-center">
        <a
          href="https://github.com/frilansaresverige/frilansaresverige.se/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-cream"
        >
          Bidra till sidan genom vår GitHub 👉
          <span className="ml-2 h-[1em]">
            <Image
              alt="Github Logo"
              src="https://github.githubassets.com/images/modules/site/icons/footer/github-mark.svg"
              width={20}
              height={20}
            />
          </span>
        </a>
      </footer>
      {/* CookieConsent unchanged */}
    </>
  )
}
```

Also drop the `import styles from '../styles/Home.module.css'` line from this file — it is no longer referenced here.

- [ ] **Step 5: Verify the shell renders correctly**

```bash
bun run dev
```
Check at http://localhost:3000 — compare against `/tmp/fs-baseline/`:
- Blue background, cream text
- **Both blobs** present bottom-right, one half-round and one full circle
- Logo top-left, footer at the bottom
- Footer stays at the bottom on a short viewport

The two page bodies will look wrong at this point — their CSS Modules are now fighting preflight. That is expected and fixed in Tasks 8–9.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(styles): enable tailwind preflight and rewrite app shell

Reduces globals.css to the two things utilities cannot express: the
decorative body pseudo-element blobs and the html/body/#__next height
chain the sticky footer depends on. Layout in _app.tsx moves to
utilities.

Page bodies are intentionally mid-migration here; Tasks 8-9 finish them."
```

---

### Task 8: Rewrite the homepage

**Files:**
- Modify: `apps/web/pages/index.tsx`
- Test: `apps/web/pages/index.spec.ts`

**Interfaces:**
- Consumes: `Card`, `Button`, `SlidingNumber`, `Slide`, `useReducedMotion` from Task 6
- Produces: `fetchMemberCount(): Promise<number | null>` exported from `index.tsx`; `HomeProps.memberCount` becomes `number | null`.

**Why the type changes:** `SlidingNumber` requires a `number`, but `memberCount` is currently a `string` that can be the Swedish fallback `'flera tusen'` when the API times out. Passing that to `SlidingNumber` would render `NaN` on every timeout. The fetch now returns `number | null` and the component branches on it.

- [ ] **Step 1: Write the failing test for the numeric return type**

Create `apps/web/pages/index.spec.ts`:
```ts
import { describe, it, expect, afterEach, jest } from 'bun:test'
import { fetchMemberCount } from './index'

afterEach(() => {
  jest.restoreAllMocks()
})

describe('fetchMemberCount', () => {
  it('returns a number when the API responds with a numeric body', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('2500') }),
    )
    expect(await fetchMemberCount()).toBe(2500)
  })

  it('returns null when the API responds with a non-numeric body', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('nope') }),
    )
    expect(await fetchMemberCount()).toBe(null)
  })

  it('returns null when the response is not ok', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ ok: false, text: () => Promise.resolve('') }))
    expect(await fetchMemberCount()).toBe(null)
  })

  it('returns null when the request rejects', async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('timeout')))
    expect(await fetchMemberCount()).toBe(null)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
bun test apps/web/pages/index.spec.ts 2>&1 | tail -20
```
Expected: FAIL — `fetchMemberCount` is not exported.

- [ ] **Step 3: Change `fetchMemberCount` to return `number | null`**

In `apps/web/pages/index.tsx`, export the function and change its contract. Keep `FALLBACK_MEMBER_COUNT = 'flera tusen'` as the *display* fallback:

```ts
export async function fetchMemberCount(): Promise<number | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(MEMBER_COUNT_API, { signal: controller.signal })
    if (!response.ok) {
      return null
    }
    const count = parseInt((await response.text()).trim(), 10)
    return Number.isNaN(count) ? null : count
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
```

Update the props interface and `getStaticProps`:
```ts
interface HomeProps {
  memberCount: number | null
}
```
`getStaticProps` keeps `revalidate: 3600` and now passes the number or `null`.

- [ ] **Step 4: Run the test and verify it passes**

```bash
bun test apps/web/pages/index.spec.ts 2>&1 | tail -20
```
Expected: PASS — 4 tests.

- [ ] **Step 5: Add the member count display component**

In `apps/web/pages/index.tsx`, add above `Home`:
```tsx
const MemberCount = ({ count }: { count: number | null }) => {
  const reduced = useReducedMotion()

  if (count === null) {
    return <>{FALLBACK_MEMBER_COUNT}</>
  }
  if (reduced) {
    return <>{count}</>
  }
  return <SlidingNumber number={count} />
}
```
Use it in both places the count appears — the intro paragraph and the second card. Keep the surrounding Swedish copy byte-identical.

- [ ] **Step 6: Replace the cards and buttons**

- The `styles.grid` div → `className="flex w-full max-w-[65em] flex-wrap items-stretch justify-center gap-6"`
- Each `styles.card` div → shadcn `<Card className="bg-brand-cream text-brand-blue rounded-[10px] p-6 text-left">`
- Card `h2` → `className="mb-4 text-xl font-bold"`; card `p` → `className="text-xl leading-relaxed"`
- Both `<Link className="primary-button">` → the animate-ui `Button` with `variant="primary"`, in whichever of the two forms Step 7 established (`asChild` wrapping the `Link`, or `buttonVariants()` applied to the `Link` directly). Keep the `<ArrowRight />` SVG as a child in both cases.
- Wrap the two cards in animate-ui `Slide` for the entrance animation, disabled when `useReducedMotion()` is true
- Remove the `Home.module.css` import

- [ ] **Step 7: Add the `primary` Button variant to the animate-ui button**

The app's canonical Button is the **animate-ui** button installed in Task 6 (that is the "interactive polish" this migration asked for), not shadcn's plain one. Add to the `cva` variants map in the animate-ui button file — the exact path is whatever Task 6 Step 5 confirmed, typically `packages/ui/src/animate-ui/components/buttons/button.tsx`.

This reproduces the old `.primary-button` exactly, including its double-ring focus:
```ts
primary:
  'bg-brand-coral text-brand-grey hover:bg-brand-coral-light rounded-[3em] px-6 py-3 text-[1.1em] font-bold gap-2 max-w-max transition-[box-shadow,background] duration-150 focus:shadow-[0_0_0_0.1em_var(--color-brand-cream),0_0_0_0.2em_var(--color-brand-coral)] focus:outline-none',
```

**`asChild` caveat:** the two homepage buttons wrap `next/link`, which needs `asChild` (Radix `Slot`). If the animate-ui button does not accept `asChild`, do **not** re-implement it — instead render the `Link` as the child and style it directly:
```tsx
<Link href="/ansokan" className={buttonVariants({ variant: 'primary' })}>
  Ansök om medlemskap
  <ArrowRight />
</Link>
```
exporting `buttonVariants` from the same file. Confirm which form applies before writing Step 6's markup.

- [ ] **Step 8: Verify the homepage renders and the fallback path works**

```bash
bun run dev
```
At http://localhost:3000, confirm against the baseline: two cream cards side by side, coral pill buttons with the arrow SVG, member count animating up once on load, correct wrapping at 390px width.

Then confirm the fallback by blocking the API — temporarily set `API_BASE_URL` to an unreachable host in `.env.local` and reload. Expected: `flera tusen` renders as text, **not** `NaN`. Remove the override afterwards.

- [ ] **Step 9: Run the full suite**

```bash
bun test 2>&1 | tail -5 && bun run check && bun run build 2>&1 | tail -5
```
Expected: 8 tests pass (4 hook + 4 fetch); check clean; build succeeds.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(home): rewrite homepage with shadcn and animate-ui

Cards and buttons move to shadcn components; the member count uses
animate-ui SlidingNumber.

fetchMemberCount now returns number | null rather than a string, because
SlidingNumber requires a number and the previous 'flera tusen' fallback
would have rendered NaN on every API timeout. The fallback is now applied
at display time."
```

---

### Task 9: Rewrite the membership form

**Files:**
- Modify: `apps/web/pages/ansokan/RequestSlackInvitationForm.tsx`

**Interfaces:**
- Consumes: `Input`, `Label`, `Textarea`, `Checkbox`, `Button`, `Alert`, `Slide`, `useReducedMotion` from Task 6
- Produces: no new exports. The form's `name` attributes must stay exactly `name`, `email`, `howlong`, `companyName`, `linkedin`, `motivation`, `freelancer-confirmation` — `useSubmitSlackInvitationForm` reads them off the event target by name, and the API handler destructures them.

- [ ] **Step 1: Confirm the field-name contract before touching anything**

```bash
grep -n "value\b" apps/web/hooks/useSubmitSlackInvitationForm.ts
```
Expected: reads `.name`, `.email`, `.howlong`, `.companyName`, `.linkedin`, `.motivation` off the form target. **Renaming any input breaks submission silently** — the request would post `undefined` and Slack would receive a blank message.

- [ ] **Step 2: Replace the success and error boxes with `Alert`**

Keep the Swedish copy byte-identical:
```tsx
if (data?.success) {
  return (
    <Alert className="mt-8 rounded-[0.5em] border-[#6a6a6a] bg-[#adffb4] p-4 text-brand-grey">
      <AlertDescription>Grattis! Din ansökan är inskickad.</AlertDescription>
    </Alert>
  )
}
if (error) {
  return (
    <Alert className="mt-8 rounded-[0.5em] border-[#6a6a6a] bg-[#ffaaaa] p-4 text-brand-grey">
      <AlertDescription>Något gick fel. Försök igen.</AlertDescription>
    </Alert>
  )
}
```
Wrap both in animate-ui `Slide`, disabled under `useReducedMotion()`.

- [ ] **Step 3: Rewrite the form wrapper and headings**

- `styles['form-title']` → `<h1 className="text-2xl text-brand-cream">`
- `styles['form-description']` → `<p className="my-4 text-[1.1em] leading-relaxed text-brand-cream">`
- `styles.form` → `<form className="rounded-[10px] bg-brand-cream p-6 text-left text-brand-blue">`

- [ ] **Step 4: Replace each field with shadcn primitives**

For each of the six text fields, this shape — `id` and `name` unchanged, Swedish label text unchanged:
```tsx
<div className="mb-4">
  <Label htmlFor="name" className="text-[1.1em] leading-relaxed">
    Namn
  </Label>
  <Input id="name" name="name" type="text" autoComplete="name" required />
</div>
```
`motivation` uses `<Textarea>` instead of `<Input>`. The `Input`/`Textarea` focus ring reproduces the old style:
`focus:shadow-[0_0_0_0.1em_var(--color-brand-cream),0_0_0_0.2em_var(--color-brand-blue)]`.

- [ ] **Step 5: Replace the checkbox row**

The old markup used `classNames(styles.item, styles.checkboxContainer)` to merge three module classes. Those collapse into a single utility string, so no class-merging helper is needed here — `classnames` is dropped in Task 10. (Where conditional merging *is* needed elsewhere, use `cn` from `@frilansaresverige/ui/lib/utils`.)
```tsx
<div className="mb-4 flex flex-row items-baseline justify-start gap-2">
  <Checkbox id="freelancer-confirmation" name="freelancer-confirmation" required />
  <Label htmlFor="freelancer-confirmation" className="text-[1.1em] leading-relaxed">
    Jag är igång som frilansare, d v s har ett bolag att fakturera genom
    och tecknat avtal med åtminstone min första kund.
  </Label>
</div>
```
**Note:** shadcn's `Checkbox` is a Radix component that renders a `button`, not an `input`. Radix does not submit a value or enforce `required` natively — but `useSubmitSlackInvitationForm` never reads this field, and the API handler ignores it, so only the browser-native required-check is affected. Preserve that by keeping a visually-hidden `<input type="checkbox" required>` bound to the same state, or use a plain styled `<input type="checkbox">` instead of the Radix component. **Verify submission is blocked when unchecked** in Step 7.

- [ ] **Step 6: Replace the submit button**

```tsx
<Button type="submit" variant="primary">
  Skicka in ansökan
</Button>
```
Remove the `RequestSlackInvitationForm.module.css` import and the `classnames` import.

- [ ] **Step 7: Verify the form works end to end**

```bash
bun run dev
```
At http://localhost:3000/ansokan:
1. Confirm all six fields, the checkbox, and the button render on cream, matching the baseline
2. **Try to submit with the checkbox unchecked — submission must be blocked**
3. Fill everything, check the box, submit. Watch the network tab: the POST body to `/api/request-slack-invitation` must contain all six keys with the typed values, none `undefined`
4. Confirm the success Alert renders

- [ ] **Step 8: Run the full suite**

```bash
bun test 2>&1 | tail -5 && bun run check && bun run build 2>&1 | tail -5
```
Expected: 8 tests pass; check clean; build succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(form): rewrite membership form with shadcn components

Fields move to shadcn Input/Label/Textarea/Checkbox/Button and the
status boxes to Alert, with animated state transitions.

Input name attributes are unchanged — useSubmitSlackInvitationForm reads
them off the form target by name, so renaming any of them would silently
post undefined values to Slack."
```

---

### Task 10: Delete dead CSS and verify against the baseline

**Files:**
- Delete: `apps/web/styles/Home.module.css`, `apps/web/pages/ansokan/RequestSlackInvitationForm.module.css`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: the completed rewrites from Tasks 7–9
- Produces: no CSS Modules remain; `classnames` is no longer a dependency.

- [ ] **Step 1: Confirm nothing still imports the CSS Modules**

```bash
grep -rn "module.css\|classnames" apps/web --include=*.tsx --include=*.ts
```
Expected: **no results**. If anything matches, that file was missed in Tasks 7–9 — fix it before deleting.

- [ ] **Step 2: Delete the CSS Modules and drop `classnames`**

```bash
rm apps/web/styles/Home.module.css
rm apps/web/pages/ansokan/RequestSlackInvitationForm.module.css
cd apps/web && bun remove classnames && cd ../..
```

Note: `.code` and `.list` in `Home.module.css` were dead `create-next-app` leftovers referenced nowhere; they leave with the file.

- [ ] **Step 3: Rebuild and confirm nothing broke**

```bash
bun run build 2>&1 | tail -10 && bun test 2>&1 | tail -5 && bun run check
```
Expected: build succeeds, 8 tests pass, check clean.

- [ ] **Step 4: Capture the after-screenshots**

With `bun run dev` running, capture the same four views as Task 7 Step 1 into `/tmp/fs-after/`:
- `/` at 1440×900 and 390×844
- `/ansokan` at 1440×900 and 390×844

- [ ] **Step 5: Compare against the baseline**

Put each before/after pair side by side and check specifically:
- [ ] Decorative blob geometry — both present, correct radii, correct bottom-right position and overlap
- [ ] Blob layering — content and footer sit *above* the blobs (`z-index`)
- [ ] Sticky footer at a short viewport height (resize to 1440×500)
- [ ] Card colours — cream `#fffce3` on blue `#4823dc`, blue text in cards
- [ ] Button — coral `#ff9c8e`, pill radius, hover goes `#ffcfc8`, focus shows the double ring
- [ ] Mobile wrapping at 390px on both pages
- [ ] `react-cookie-consent` bar renders correctly — it uses inline styles and should be unaffected by preflight, but it is the one third-party visual that could not be verified by reading

Any difference that is not a deliberate improvement must be fixed before committing.

- [ ] **Step 6: Verify the production container one more time**

The CSS rewrite changes what gets bundled, so re-run the container gate:
```bash
docker build -t frilansaresverige-website:css-test .
docker run --rm -d -p 3001:3000 --name fs-smoke frilansaresverige-website:css-test
sleep 3
curl -sf -o /dev/null -w "/ -> %{http_code}\n" http://localhost:3001/
curl -sf -o /dev/null -w "/ansokan -> %{http_code}\n" http://localhost:3001/ansokan
docker rm -f fs-smoke
```
Expected: both `200`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(styles): remove css modules and the classnames dependency

Completes the Tailwind migration. Verified by comparing before/after
screenshots of both routes at desktop and mobile widths, with particular
attention to the decorative blob geometry and the sticky footer."
```

---

### Task 11: Add Storybook

**Files:**
- Create: `apps/web/.storybook/main.ts`, `apps/web/.storybook/preview.ts`, `packages/ui/src/ui/button.stories.tsx`, `packages/ui/src/ui/card.stories.tsx`, `packages/ui/src/ui/input.stories.tsx`, `packages/ui/src/animate-ui/sliding-number.stories.tsx`
- Modify: `apps/web/package.json`, `package.json` (root), `README.md`

**Interfaces:**
- Consumes: components from Task 6, theme from Task 5
- Produces: `bun run storybook` (dev) and `bun run build-storybook` (static build).

- [ ] **Step 1: Install Storybook**

```bash
cd apps/web
bun add -d storybook@10.5.10 @storybook/nextjs-vite@10.5.10 @storybook/addon-docs@10.5.10 vite@8.2.2
cd ../..
bun install
```

`@storybook/nextjs-vite` is chosen over the webpack `@storybook/nextjs` for two reasons: it provides `next/link`, `next/image` and router mocking that the components need, and being Vite-based it keeps `@storybook/addon-vitest` a drop-in if the test-runner decision is ever revisited.

- [ ] **Step 2: Configure Storybook to glob both workspaces**

Create `apps/web/.storybook/main.ts`:
```ts
import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  stories: [
    '../**/*.stories.@(ts|tsx)',
    '../../../packages/ui/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
}

export default config
```

- [ ] **Step 3: Load the brand theme into every story**

Create `apps/web/.storybook/preview.ts`. Importing `globals.css` is what gives stories the brand palette and preflight:
```ts
import type { Preview } from '@storybook/nextjs-vite'

import '../styles/globals.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'brand',
      values: [{ name: 'brand', value: '#4823dc' }],
    },
  },
}

export default preview
```

- [ ] **Step 4: Add the Storybook scripts**

In `apps/web/package.json`:
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```
In the root `package.json`:
```json
"storybook": "bun run --filter '@frilansaresverige/web' storybook",
"build-storybook": "bun run --filter '@frilansaresverige/web' build-storybook"
```

- [ ] **Step 5: Write the Button stories**

This story covers the **animate-ui** button — the app's canonical Button per Task 8 Step 7. Place the file beside whatever path Task 6 Step 5 confirmed (typically `packages/ui/src/animate-ui/components/buttons/button.stories.tsx`) and make the relative import match that directory:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Ansök om medlemskap' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary' },
}

export const Default: Story = {}
```

- [ ] **Step 6: Write the Card, Input and SlidingNumber stories**

Create `packages/ui/src/ui/card.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Card } from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
  args: {
    className: 'bg-brand-cream text-brand-blue rounded-[10px] p-6 max-w-md',
    children: 'Vi hjälper varandra med allt som rör livet som frilansare!',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

Create `packages/ui/src/ui/input.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  args: { placeholder: 'Namn', type: 'text' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

Create `packages/ui/src/animate-ui/sliding-number.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SlidingNumber } from './sliding-number'

const meta = {
  title: 'Animate UI/SlidingNumber',
  component: SlidingNumber,
  args: { number: 2500 },
} satisfies Meta<typeof SlidingNumber>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

If any import path differs from what Task 6 actually generated, fix the specifier to match the real file — do not create a re-export shim.

- [ ] **Step 7: Run Storybook and confirm the stories render on-brand**

```bash
bun run storybook
```
At http://localhost:6006, confirm all four stories render with the brand palette — coral pill button, cream card on blue, cream input — not unstyled. **Unstyled components mean the `@source` directive from Task 5 is not resolving.**

- [ ] **Step 8: Verify the static build**

```bash
bun run build-storybook 2>&1 | tail -10
```
Expected: succeeds, output in `apps/web/storybook-static`. Confirm it is gitignored:
```bash
git status --short | grep storybook-static
```
Expected: no output.

- [ ] **Step 9: Document Storybook in the README**

Add under "Getting Started with development":
````markdown
### Component library

Components live in `packages/ui` and are catalogued in Storybook:

```bash
bun run storybook
```
````

- [ ] **Step 10: Run the full verification suite**

```bash
bun run build 2>&1 | tail -5 && bun test 2>&1 | tail -5 && bun run check && bun run build-storybook 2>&1 | tail -3
```
Expected: all four pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add storybook 10 for the component library

Uses @storybook/nextjs-vite so stories get next/link, next/image and
router mocking, and so addon-vitest stays a drop-in if the test runner
decision is revisited. Stories are globbed from both apps/web and
packages/ui; preview.ts imports globals.css so stories render on-brand."
```

---

## Final verification

After Task 11, before opening a PR:

```bash
bun install --frozen-lockfile
bun run build
bun test
bun run check
bun run build-storybook
docker build -t frilansaresverige-website:final .
docker run --rm -d -p 3001:3000 --name fs-final frilansaresverige-website:final
sleep 3
curl -sf -o /dev/null -w "/ -> %{http_code}\n" http://localhost:3001/
curl -sf -o /dev/null -w "/ansokan -> %{http_code}\n" http://localhost:3001/ansokan
docker rm -f fs-final
```

All must pass, both routes `200`.

**Do not run `deploy.sh`.** Deployment is the maintainer's call, and the spec puts it out of scope.

## Spec coverage

| Spec requirement | Task |
|---|---|
| Bun package manager, lockfile, Docker build | 1 |
| `bun test` replacing Jest | 2 |
| Biome replacing ESLint + Prettier | 3 |
| Workspace, `packages/*`, `outputFileTracingRoot` | 4 |
| Tailwind v4, brand tokens, `@source`, preflight off | 5 |
| shadcn + animate-ui components, reduced-motion | 6 |
| Preflight on, blobs and height chain retained | 7 |
| Homepage rewrite, SlidingNumber | 8 |
| Form rewrite, Alert, field-name contract | 9 |
| CSS Modules deleted, screenshot verification | 10 |
| Storybook 10 on `nextjs-vite`, stories from both workspaces | 11 |
| Production runtime stays Node | 1, 4 (runner stage unchanged) |
| `pages/api/hello.ts` untouched | — (out of scope, never referenced) |
