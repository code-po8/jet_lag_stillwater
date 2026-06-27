# Production image for the Fastify backend (used by Railway — INFRA-007).
#
# Multi-stage: build TypeScript -> run compiled JS on a slim runtime as non-root.
# Respects the npm hardening (INFRA-002): installs run with --ignore-scripts
# (the .npmrc is copied in), and there are no native deps in the server tree to
# rebuild today.

# ---- build stage ----------------------------------------------------------
# Build context is the repo root so the shared/ package (a TS project the
# server references) is available alongside server/.
FROM node:22-bookworm-slim AS build
WORKDIR /app/server

# Install server deps first (better layer caching). --ignore-scripts mirrors .npmrc.
COPY server/package.json server/package-lock.json ./
RUN npm ci --ignore-scripts

# Bring in the shared package (project reference) and the server sources.
COPY shared /app/shared
COPY server/tsconfig.json ./
COPY server/src ./src

# Compile (tsc --build builds the shared reference first) → /app/server/dist.
RUN npm run build

# Drop devDependencies for the runtime image.
RUN npm prune --omit=dev --ignore-scripts

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

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
