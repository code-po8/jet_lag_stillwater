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

# 3. Whole-project type check.
echo "-- type-check --"
npm run type-check

# 4. Unit tests related to staged .ts/.vue files.
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|vue)$' | tr '\n' ' ' || true)
if [ -n "$STAGED_FILES" ]; then
  echo "-- vitest related --"
  npx vitest related --run $STAGED_FILES
else
  echo "-- vitest related: no .ts/.vue staged, skipping --"
fi

echo "== pre-commit checks passed =="
