# Production image for the Fastify backend (used by Railway — INFRA-007).
#
# Multi-stage: build TypeScript -> run compiled JS on a slim runtime as non-root.
# Respects the npm hardening (INFRA-002): installs run with --ignore-scripts
# (the .npmrc is copied in), and there are no native deps in the server tree to
# rebuild today.

# ---- build stage ----------------------------------------------------------
# Build context is the repo root so the shared/ package (a real workspace-style
# package the server depends on via `file:../shared`) is available alongside
# server/.
FROM node:22-bookworm-slim AS build

# Build the shared package FIRST so its dist/ exists when the server installs it
# as a `file:` dependency (npm materializes it into node_modules at that point,
# which is what lets `node dist/server.js` resolve @jet-lag-stillwater/shared at
# runtime — a bare tsconfig path alias would NOT resolve under plain Node).
WORKDIR /app/shared
COPY shared/package.json ./
COPY shared/tsconfig.json ./
COPY shared/src ./src
# The shared build needs typescript; install its (dev) deps in isolation.
RUN npm install --ignore-scripts && npm run build

WORKDIR /app/server
# Install server deps (incl. the file:../shared package, now that shared/dist
# exists). --ignore-scripts mirrors the .npmrc hardening.
COPY server/package.json server/package-lock.json ./
RUN npm ci --ignore-scripts

# Bring in the server sources and compile → /app/server/dist.
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# Drop devDependencies for the runtime image (keeps node-pg-migrate, pg,
# fastify — all prod deps).
RUN npm prune --omit=dev --ignore-scripts

# npm installs the file:../shared dependency as a SYMLINK to /app/shared, which
# would dangle in the runtime stage (that stage copies node_modules but not
# /app/shared). Replace the symlink with a real copy of the built package so
# `node dist/server.js` resolves @jet-lag-stillwater/shared under plain Node.
RUN rm -f node_modules/@jet-lag-stillwater/shared \
  && mkdir -p node_modules/@jet-lag-stillwater/shared \
  && cp /app/shared/package.json node_modules/@jet-lag-stillwater/shared/ \
  && cp -r /app/shared/dist node_modules/@jet-lag-stillwater/shared/dist

# ---- runtime stage --------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# tini for clean signal handling / graceful shutdown.
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/server/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server/dist ./dist
COPY --chown=node:node server/package.json ./package.json
# SQL migrations run programmatically on boot (src/db/migrate.ts resolves
# ../../migrations from dist/db), so they must ship in the runtime image.
COPY --chown=node:node server/migrations ./migrations

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
