# Migration: Bun, workspaces, Tailwind/shadcn, Storybook, Biome

Date: 2026-08-24
Status: Approved for planning

## Goal

Migrate `frilansaresverige.se` from an npm-managed single-package Next.js app to
a Bun workspace monorepo with a shared component library built on Tailwind CSS
v4, shadcn/ui and animate-ui, catalogued in Storybook, linted and formatted by
Biome, and tested with `bun test`.

## Current state

Next.js 16 (Pages Router), React 19, TypeScript 6. 39 tracked files.

| Area | Today |
|---|---|
| Package manager | npm, `package-lock.json` |
| Structure | Single package at repo root |
| Pages | `/` (marketing), `/ansokan` (membership form) |
| API | `pages/api/request-slack-invitation.ts` (Slack webhook), `pages/api/hello.ts` (scaffolding) |
| Styling | Hand-written CSS + CSS Modules, 270 lines, bespoke brand palette |
| Tests | Jest + Testing Library, one spec (`hooks/useSubmitSlackInvitationForm.spec.ts`) |
| Lint/format | ESLint 9 (`eslint-config-next`) + Prettier |
| Deploy | Multi-stage Docker (`node:24-alpine`, `npm ci`, Next `standalone`) → `deploy.sh` → ssh |

## Decisions

These were settled during brainstorming and are inputs to the plan, not open
questions.

1. **Monorepo motivation:** a second app is coming. The workspace exists so both
   apps can share `ui` and config packages.
2. **Second app is not scaffolded now.** Migrate only the existing site; leave
   `apps/` ready to receive another. No placeholder or empty app is committed.
3. **Full CSS rewrite to Tailwind.** CSS Modules are deleted, preflight is
   adopted. The risk (visual drift on a live site) was raised and accepted;
   it is mitigated by screenshot comparison, not by scope reduction.
4. **Test runner: `bun test`.** Storybook has no bun-test integration, so the
   automatic story-as-test sweep is knowingly forgone. Storybook uses the
   Vite-based framework so `addon-vitest` stays a drop-in if that changes.
5. **Biome only.** ESLint and Prettier are deleted outright. The Next-specific
   rules (`no-html-link-for-pages`, `no-img-element`, `no-sync-scripts`) and
   `eslint-plugin-testing-library` have no Biome equivalent and are given up.
6. **Production runtime stays Node.** Bun builds; `node:24-alpine` serves.
7. **animate-ui is used in four places** (member count, card entrance, button,
   form transitions), all gated on `prefers-reduced-motion`.

## Verified facts

Checked against the npm registry and vendor docs on 2026-08-24, because version
assumptions drove several decisions:

- `storybook` / `@storybook/nextjs-vite` / `@storybook/addon-vitest`: **10.5.10**
- `@storybook/nextjs-vite@10.5.10` peers: `next ^14.1 || ^15 || ^16`, `react ^16.8–^19`
- `@storybook/addon-vitest@10.5.10` peers: `vitest ^3 || ^4`, `@vitest/browser`,
  `@vitest/browser-playwright` — and it requires a **Vite-based** Storybook
  framework, which is why `@storybook/nextjs-vite` is chosen over the webpack
  `@storybook/nextjs`
- `tailwindcss`: **4.3.3**; `shadcn`: **4.19.0**; `motion`: **13.1.1**;
  `@biomejs/biome`: **2.5.10**
- animate-ui is distributed as a **shadcn CLI registry** (components are copied
  into the repo), not as an npm package. It therefore requires Tailwind and the
  shadcn conventions.
- Local toolchain: `bun 1.3.14`, `node v24.6.0`

## Target structure

```
├── package.json          # workspaces: ["apps/*", "packages/*"]
├── bun.lock              # replaces package-lock.json
├── biome.json            # single root config
├── bunfig.toml           # test preload
├── .bun-version          # new
├── .nvmrc / .node-version  # stay at v24 — runtime is still Node
├── Dockerfile
├── deploy.sh             # unchanged
├── apps/
│   └── web/              # @frilansaresverige/web
│       ├── .storybook/   # main.ts, preview.ts
│       ├── next.config.js
│       ├── pages/  hooks/  public/  styles/
└── packages/
    ├── ui/               # @frilansaresverige/ui
    │   ├── components.json         # shadcn config
    │   └── src/
    │       ├── lib/utils.ts        # cn()
    │       ├── styles/theme.css    # @theme brand tokens
    │       ├── ui/                 # shadcn primitives
    │       └── animate-ui/         # animate-ui components
    └── tsconfig/         # base.json, nextjs.json, react-library.json
```

`hooks/` stays in `apps/web`: `useSubmitSlackInvitationForm` posts to that app's
own API route and is not shared surface.

**No Turborepo.** With one app it is overhead. It can be added later without
restructuring. Root scripts delegate with `bun run --filter`.

## Design

### Package boundaries

- `packages/ui` owns presentation only: shadcn primitives, animate-ui
  components, the `cn()` helper, and the Tailwind theme. It has no knowledge of
  routing, data fetching, or the Slack API. It must remain importable by a
  second app with no changes.
- `packages/tsconfig` owns compiler configuration only.
- `apps/web` owns pages, routing, API handlers, and app-specific hooks.

Test of the boundary: if adding the second app requires editing `packages/ui`
for anything other than adding a component, the boundary is wrong.

### Tailwind theme

The brand palette is effectively a dark theme (blue ground, cream text), the
inverse of shadcn's light default. `:root` **is** the brand theme. There is no
`.dark` class and no light variant; the site has one look.

`packages/ui/src/styles/theme.css`:

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
}
```

`apps/web/styles/globals.css`:

```css
@import "tailwindcss";
@import "@frilansaresverige/ui/styles/theme.css";
@source "../../../packages/ui/src";
```

The `@source` directive is **required**. Tailwind v4 does not scan linked
workspace packages for class names by default; without it every `packages/ui`
component renders unstyled while the build still succeeds.

### CSS rewrite

Retained as hand-written CSS in `@layer base` (no utility equivalent exists):

- `body::before` / `body::after` — the two 40em decorative blobs. Fixed
  position, `z-index` layered, `translateX(50%)`, one with
  `border-radius: 50% 50% 0 0` and one fully round. **Highest-risk element in
  the migration.**
- The `html,body{height:100%}` → `body>div{height:100%; display:flex;
  flex-direction:column}` chain that Next's `#__next` wrapper relies on for the
  sticky footer.

Deleted and replaced by utilities or components:

| Current | Becomes |
|---|---|
| `.content`, `main`, `.spacer`, `.logo-container` | Layout utilities in `_app.tsx` |
| `.footer`, `.description` | Utilities in `_app.tsx` / `index.tsx` |
| `.grid` | `flex items-stretch justify-center flex-wrap w-full max-w-[65em] gap-6` |
| `.card` | shadcn `Card` with brand tokens |
| `.logo` | Utility on the GitHub `Image` |
| `.primary-button` (3 usages) | shadcn `Button`, pill variant, `asChild` for the two `Link` usages |
| global `input` / `textarea` block | shadcn `Input` / `Textarea` |
| form module (`.form-wrapper`, `.item`, `.label`, `.checkbox`, …) | shadcn `Input`, `Label`, `Textarea`, `Checkbox`, `Button` |
| `.success-box`, `.error-box` | shadcn `Alert` |
| `.code`, `.list` | **Deleted** — dead `create-next-app` leftovers, referenced nowhere |

The `.primary-button` focus style
(`box-shadow: 0 0 0 0.1em var(--white), 0 0 0 0.2em var(--coral)`) is preserved
as a Button ring variant; the equivalent input focus ring uses `--brand-blue`.

The font stack (`-apple-system, BlinkMacSystemFont, …`) maps to `--font-sans`.

`classnames` is removed in favour of shadcn's `cn()` (clsx + tailwind-merge).

### animate-ui usage

All four are gated on `prefers-reduced-motion`; durations kept short.

1. **Member count** — `SlidingNumber` on `{memberCount}`, rendered twice on the
   homepage. Build-time data (`getStaticProps`), so no loading jank.
2. **Card entrance** — the two homepage cards fade/slide in on mount.
3. **Button** — the shadcn `Button` becomes the animate-ui interactive variant,
   replacing the current CSS hover transition.
4. **Form** — animated swap between the form, success, and error states, where
   there is a real network wait.

### Storybook

Lives in `apps/web` using `@storybook/nextjs-vite`, with stories globbed from
**both** `apps/web` and `packages/ui`.

Rationale: `_app.tsx` and both pages use `next/link` and `next/image`, so
components reach for Next primitives. `@storybook/react-vite` in `packages/ui`
would require hand-maintained mocks for those. The Vite-based framework also
keeps `addon-vitest` a drop-in if decision 4 is ever revisited.

### Biome

`.prettierrc` maps onto Biome's formatter with settings preserved exactly:
`semicolons: "asNeeded"`, `quoteStyle: "single"`, `jsxQuoteStyle: "double"`,
`indentWidth: 2`, `lineEnding: "lf"`, `indentStyle: "space"`. Biome is close
enough to Prettier that with these preserved the reformat diff should be
near-empty.

The one substantial diff is `organizeImports`, which reorders imports across
every file. This is why the Biome phase is committed alone.

Config uses `vcs.useIgnoreFile` and excludes `.next`, `node_modules`,
`storybook-static`.

### Testing

`bun:test` exports a `jest` compatibility object, so `jest.fn()` and
`jest.clearAllMocks()` in the existing spec keep working. Changes:

- Add `import { describe, it, expect, afterAll, jest } from 'bun:test'`
- Delete `jest.config.mjs`, `jest.setup.ts`, and the `next/jest` dependency
- Preload `@happy-dom/global-registrator` via `bunfig.toml` so `renderHook` has
  a DOM
- `tsconfig` types: `["node","jest"]` → `["node","bun"]`

All four existing test cases stay semantically identical. No new test coverage
is added by this migration; that is out of scope.

### Docker and deploy

`oven/bun:1-alpine` for deps and build stages; `node:24-alpine` runner
executing `server.js`, as today.

Two load-bearing details, both to be verified with a real `docker build` rather
than by inspection:

1. **`outputFileTracingRoot` must point at the repo root.** Otherwise Next's
   standalone output nests differently and the `COPY` paths break *silently* —
   the build succeeds and the app 404s at runtime. Paths become
   `apps/web/.next/standalone`, `apps/web/.next/static`, and
   `CMD ["node", "apps/web/server.js"]`.
2. **Bun workspace hoisting.** `bun install` may place some modules under
   `apps/web/node_modules` rather than hoisting all to root, making the
   deps-stage `COPY --from=deps /app/node_modules` incomplete. Fallback: run
   `bun install` in the builder stage.

`deploy.sh` is unchanged — it operates on the built image, whose name and
contract are unchanged.

## Phased execution

Seven commits, each independently buildable, testable and revertable.

| # | Phase | Verification |
|---|---|---|
| 1 | **Bun** — lockfile, Docker build stages, `.envrc`/`.bun-version`, scripts | `bun install`, `bun run build`, `docker build` all pass |
| 2 | **`bun test`** — migrate the spec, drop Jest | 4 test cases pass |
| 3 | **Biome** — delete ESLint + Prettier, reformat | `biome check` clean; build passes |
| 4 | **Workspace** — `apps/web`, `packages/*`, `outputFileTracingRoot`, Docker paths | Build + test + `docker build`; container serves both routes |
| 5 | **Tailwind + `packages/ui`** — theme, shadcn, animate-ui, **preflight off** | Site renders **visually unchanged** (a utilities stylesheet is added; no existing rule is altered) |
| 6 | **CSS rewrite** — pages to Tailwind, preflight on, CSS Modules deleted | Screenshot comparison (below) |
| 7 | **Storybook** — catalogue components | `storybook build` succeeds |

Phase 5/6 split is deliberate: Tailwind v4's preflight is what breaks
`globals.css`. Keeping preflight off in phase 5 means shadcn and animate-ui land
while the live site is provably unchanged. Phase 6 then flips preflight and
rewrites the pages as one reviewable, revertable unit. Merged, a broken deploy
would give no signal about which of the two caused it.

Storybook is last: the stories worth having are of the *rewritten* components.

## Verification of the CSS rewrite

Captured before phase 6 and re-captured after, then compared:

- `/` at desktop and mobile widths
- `/ansokan` at desktop and mobile widths
- The form's **success** and **error** states (reachable by stubbing the fetch)

Particular attention to:

- The `body::before`/`::after` blob geometry and layering
- Sticky-footer behaviour at short viewport heights
- `react-cookie-consent`, which renders via inline styles and should be
  unaffected by preflight — but it is the one third-party visual that cannot be
  verified by reading

## Out of scope

- The second app. Not scaffolded, not migrated.
- `pages/api/hello.ts`. It is untouched `create-next-app` scaffolding; deleting
  it was not requested and is left alone.
- New test coverage beyond porting the existing spec.
- Turborepo.
- Visual regression tooling (Chromatic or similar) as a permanent fixture. The
  phase-6 screenshot check is a one-time manual comparison.
- Any change to `deploy.sh`, the server, or the Slack webhook contract.

## Accepted risks

| Risk | Mitigation |
|---|---|
| Visual drift from the full CSS rewrite | Phase 5/6 split; before/after screenshots at two widths plus form states |
| Decorative blob geometry breaking under preflight | Retained as hand-written `@layer base`; explicitly in the screenshot checklist |
| Loss of Next-specific lint rules | Accepted (decision 5). `next build` still surfaces the serious cases |
| No story-as-test sweep | Accepted (decision 4). Vite-based framework keeps `addon-vitest` a drop-in |
| Docker `COPY` paths silently wrong under workspaces | Real `docker build` + container smoke test in phase 4, before any styling work |
