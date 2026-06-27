# Production image for the Fastify backend (used by Railway — INFRA-007).
#
# Multi-stage: build TypeScript -> run compiled JS on a slim runtime as non-root.
# Respects the npm hardening (INFRA-002): installs run with --ignore-scripts
# (the .npmrc is copied in), and there are no native deps in the server tree to
# rebuild today.

# ---- build stage ----------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install deps first (better layer caching). --ignore-scripts mirrors .npmrc.
COPY server/package.json server/package-lock.json ./
RUN npm ci --ignore-scripts

# Compile TypeScript to dist/.
COPY server/tsconfig.json ./
COPY server/src ./src
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

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server/package.json ./package.json

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
