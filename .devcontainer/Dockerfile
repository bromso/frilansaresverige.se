# Development container only. This is NOT the image that gets deployed —
# production is built by the Dockerfile at the repo root, which serves on
# node:24-alpine. Nothing here should be assumed to match that image.
#
# Node 24 matches .node-version / .nvmrc and the production runner's major.
# Debian (bookworm) rather than Alpine: the devcontainers images are
# Debian-based and carry the shell, git and user setup a dev environment
# wants. The trade-off is glibc here vs musl in production, so a musl-only
# problem would not surface in dev — the container smoke test in the root
# Dockerfile remains the check for that.
FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm

# Pin Bun to exactly the version the production build uses. Kept in sync by
# hand with .bun-version and the two `oven/bun:` FROM lines in the root
# Dockerfile — there is no maintained first-party Bun devcontainer Feature,
# and a pinned install is more auditable than depending on a third-party one.
ARG BUN_VERSION=1.3.14
ENV BUN_INSTALL=/usr/local/bun
ENV PATH=${BUN_INSTALL}/bin:${PATH}

RUN curl -fsSL https://bun.sh/install | bash -s -- "bun-v${BUN_VERSION}" \
    && chmod -R a+rx "${BUN_INSTALL}" \
    # ENV PATH alone is not enough: the devcontainer terminal opens a LOGIN
    # shell, which re-sources /etc/profile and clobbers it, so `bun` ends up
    # not found for the remoteUser. Symlink into a directory already on the
    # default PATH so it resolves in login and non-login shells alike.
    && ln -s "${BUN_INSTALL}/bin/bun" /usr/local/bin/bun \
    && ln -s "${BUN_INSTALL}/bin/bunx" /usr/local/bin/bunx \
    && bun --version
