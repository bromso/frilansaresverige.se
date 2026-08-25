# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
# Each workspace package needs its own manifest copied before install —
# bun install --frozen-lockfile fails if the lockfile references a workspace
# whose package.json is not on disk.
COPY apps/web/package.json apps/web/
COPY apps/story/package.json apps/story/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/
# apps/story is Storybook — a dev-only workspace that is never built or
# served here. Its manifest must still be copied above (a frozen install
# fails on a lockfile reference whose package.json is absent), but excluding
# it from the install drops ~128 packages / ~96MB from this layer. That is
# real deploy time: deploy.sh streams the whole image over ssh.
RUN bun install --frozen-lockfile --filter '!@frilansaresverige/story'

FROM oven/bun:1.3.14-alpine AS builder
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
