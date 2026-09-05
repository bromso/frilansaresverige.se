#!/bin/bash
set -e

# Start Docker: systemctl on Linux, or Docker Desktop on macOS if that fails.
if ! sudo systemctl start docker 2>/dev/null; then
  open -a Docker
  while ! docker info >/dev/null 2>&1; do sleep 1; done
fi

# Build for the prod server's architecture (amd64), not the local one — building
# on Apple Silicon would otherwise produce an arm64 image the server can't exec.
# Build-time config comes from apps/web/.env.local (gitignored, and excluded
# from the image by .dockerignore). Only the analytics id and site URL are
# needed at build time; the Slack webhooks are runtime-only and live in the
# compose file on the server.
if [ -f apps/web/.env.local ]; then
  # shellcheck disable=SC1091
  set -a; . apps/web/.env.local; set +a
fi
docker build --platform linux/amd64 -t frilansaresverige-website \
  --build-arg GOOGLE_ANALYTICS_ID="${GOOGLE_ANALYTICS_ID:-}" \
  --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://frilansaresverige.se}" \
  .
docker save frilansaresverige-website:latest | gzip | ssh gredelin 'gunzip | docker load'
ssh gredelin 'cd /home/martin/frilansaresverige && docker compose up -d'
