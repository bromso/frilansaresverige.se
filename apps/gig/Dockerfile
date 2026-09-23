# syntax=docker/dockerfile:1

# Built from the repo root so the workspace install resolves bun.lock.
FROM oven/bun:1.4.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
# Every workspace manifest must exist for a frozen install, even the ones
# filtered out below.
COPY apps/web/package.json apps/web/
COPY apps/story/package.json apps/story/
COPY apps/gig/package.json apps/gig/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/
RUN bun install --frozen-lockfile --production --filter '@frilansaresverige/gig'

FROM oven/bun:1.4.2-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8989
COPY --from=deps /app/node_modules ./node_modules
COPY apps/gig ./apps/gig
# The image ships a `bun` user; nothing here needs root.
USER bun
EXPOSE 8989
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8989/api/health || exit 1
CMD ["bun", "apps/gig/src/index.ts"]
