#!/usr/bin/env sh
# Pre-commit checks, run INSIDE the sandbox container (see the `hooks` service
# in docker-compose.yml). This keeps eslint/prettier/vue-tsc/vitest/gitleaks —
# all of which execute third-party dependency code — off the host user.
#
# Invoked by scripts/run-hooks.sh, which is called from .husky/pre-commit.
# Runs with network_mode: none; the gitleaks binary is baked into the image.
set -eu

echo "== pre-commit checks (sandboxed) =="

# 1. Secret scan on staged changes (gitleaks via the project's wrapper).
echo "-- secret scan --"
npm run secrets:scan:staged

# 2. lint-staged: eslint --fix + prettier --write on staged files.
echo "-- lint-staged (eslint + prettier) --"
npx lint-staged

# 3. Frontend type check (vue-tsc). Server type-check/tests run in their own
#    container (docker compose run --rm test-server) and in CI.
echo "-- type-check (frontend) --"
npm run type-check

# 4. Frontend unit tests related to staged frontend files only.
#    Server files (server/**) are excluded — this container has the frontend's
#    deps + vite config, not the server's, so it cannot transform them.
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR \
  | grep -E '\.(ts|vue)$' \
  | grep -vE '^server/' \
  | tr '\n' ' ' || true)
if [ -n "$STAGED_FILES" ]; then
  echo "-- vitest related (frontend) --"
  npx vitest related --run $STAGED_FILES
else
  echo "-- vitest related: no frontend .ts/.vue staged, skipping --"
fi

# 5. If backend sources changed, remind that they're verified separately.
if git diff --cached --name-only --diff-filter=ACMR | grep -qE '^server/.*\.ts$'; then
  echo "-- note: server/ changed — verify with: docker compose run --rm test-server --"
fi

echo "== pre-commit checks passed =="
