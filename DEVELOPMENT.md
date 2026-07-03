# Development Guide

Complete guide for setting up, developing, testing, and deploying the Jet Lag Stillwater app.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [NPM Scripts Reference](#npm-scripts-reference)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security: Secret Detection](#security-secret-detection)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required: Node.js

Node.js is the only thing you need to install manually. Everything else is handled by npm.

**Recommended:** Use Node Version Manager (nvm) to manage Node.js versions.

#### Option A: Install nvm (Recommended)

```bash
# Linux/macOS/WSL
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install --lts
nvm use --lts

# Verify installation
node --version   # Should show v20.x.x or similar LTS
npm --version    # Should show 10.x.x or similar
```

#### Option B: Direct Install

Download and install from [nodejs.org](https://nodejs.org/) (choose LTS version).

### Verify Installation

```bash
node --version   # Expect: v18.x.x or v20.x.x
npm --version    # Expect: 9.x.x or 10.x.x
```

---

## Local Development Setup

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/jet_lag_stillwater.git
cd jet_lag_stillwater

# 2. Install all dependencies (reads package.json)
npm install

# 3. Install Playwright browsers (for E2E tests)
npx playwright install

# 4. Verify setup by running tests
npm run test:unit

# 5. Start the development server
npm run dev
```

The dev server will show a URL (typically `http://localhost:5173`). Open it in your browser.

### Returning to Development

After initial setup, you typically just need:

```bash
cd jet_lag_stillwater
npm run dev
```

If dependencies have changed (after pulling new code):

```bash
git pull
npm install      # Installs any new dependencies
npm run dev
```

---

## npm Hardening (Supply-Chain Defense)

The repo ships an `.npmrc` (INFRA-002) that hardens installs as defense-in-depth
alongside the Docker sandbox:

| Setting               | Effect                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ignore-scripts=true` | Package lifecycle scripts (pre/post-install, prepare) do **not** run on install — blocks the most common npm attack vector. |
| `save-exact=true`     | Adding a dep pins an exact version (no `^`/`~`), so a compromised patch release can't slip in on the next install.          |
| `engine-strict=true`  | Install fails if Node/npm don't satisfy `engines`.                                                                          |

Two consequences to be aware of:

- **Native deps need an explicit rebuild.** Because install scripts are skipped,
  native modules aren't built automatically. The current allowlist is **`sharp`**
  (used by `scripts/generate-pwa-icons.mjs`). The `install` compose service runs
  `npm rebuild sharp` after `npm ci`. If you add a native dependency, add it to
  that rebuild command.
- **Husky git hooks don't auto-install.** `prepare: husky` is a lifecycle script,
  so it's skipped on install. After a fresh clone/install, set up the git hooks
  once:

  ```bash
  npm run prepare    # installs the .husky/_ hook wrappers (safe: just husky)
  ```

  CI does not need this (it invokes lint/type-check/test directly via `npm run`).

---

## Sandboxed Development & Testing (Docker)

> **Why:** installing or running npm dependencies executes untrusted third‑party
> code (pre/post‑install scripts, the dev server, the test runner). Running that
> directly on your host user exposes `~/.ssh`, `~/.npmrc` tokens, cloud
> credentials, and your entire home directory to a compromised package. The
> Docker sandbox runs all of that **inside containers that bind‑mount only the
> repo source** — never `$HOME`, never `~/.ssh`, with no git credentials and as
> a non‑root user. (INFRA‑001)

**You still edit files and run `git` on the host as usual.** Only commands that
execute dependency code are moved into containers.

### Prerequisites

- Docker Engine + Docker Compose v2 (`docker compose version`)

### Everyday commands

```bash
# Frontend ------------------------------------------------------------------
# Install frontend deps into the container's node_modules volume
# (run once, and any time package.json / package-lock.json changes)
docker compose run --rm install

# Run the frontend dev server (http://localhost:5173)
docker compose up frontend

# Run frontend type-check + the full unit suite (network-isolated)
docker compose run --rm test

# Backend (server/) ---------------------------------------------------------
# Install backend deps (separate package + lockfile, own volume)
docker compose run --rm install-server

# Run the backend dev server + Postgres (http://localhost:3000/health)
# On startup it waits for Postgres and applies pending migrations automatically.
# If host port 5432 is taken: POSTGRES_HOST_PORT=5433 docker compose up backend
docker compose up backend

# Run backend type-check + unit tests (network-isolated, no DB)
docker compose run --rm test-server

# Run backend integration tests against a real Postgres (room REST endpoints)
POSTGRES_HOST_PORT=5433 docker compose run --rm itest-server

# E2E (Playwright) --------------------------------------------------------
# Offline E2E suite (no server/DB), chromium baked into the Playwright image
docker compose run --rm e2e

# Full-stack MULTIPLAYER E2E: 2 browsers vs a real WS server + Postgres, all
# inside one container. playwright.config.ts's webServer boots the API server
# (auto-migrates) + Vite; the container reaches Postgres over the compose
# network. If host 5432 is taken, set POSTGRES_HOST_PORT to a free port.
POSTGRES_HOST_PORT=55434 docker compose run --rm e2e-multiplayer
# Scope to a single test:
POSTGRES_HOST_PORT=55434 docker compose run --rm e2e-multiplayer \
  npx playwright test --project=multiplayer --grep "mid-game refresh"

# Run / roll back DB migrations manually (against the compose Postgres)
docker compose run --rm --entrypoint sh backend -c "cd /app/server && npm run migrate:up"
docker compose run --rm --entrypoint sh backend -c "cd /app/server && npm run migrate:down"
```

**Database schema (INFRA-004):** `sessions` (rooms) and `players`, managed by
`node-pg-migrate` (SQL migrations in `server/migrations/`). Room codes recycle
via a partial unique index (`UNIQUE (code) WHERE status <> 'ended'`). An expiry
sweeper (`server/src/db/sweeper.ts`) evicts rooms past their `expires_at`.

### How the isolation works

- **No home/SSH mount.** `docker-compose.yml` bind-mounts only `./:/app`. There
  is no `$HOME` or `~/.ssh` mount anywhere, so package scripts cannot read your
  credentials.
- **Non-root.** Containers run as the unprivileged `node` user.
- **node_modules in a named volume.** Dependencies install into the
  `frontend_node_modules` volume, never the host's `node_modules`, so
  host-incompatible native builds and install-script side effects stay contained.
- **No network for tests.** The `test` and `sentinel` services use
  `network_mode: "none"`, which kills the common postinstall exfiltration /
  second-stage download path.

### Verifying the sandbox (sentinel)

A sentinel proves the two guarantees — host home unreadable, no network:

```bash
./scripts/run-sandbox-sentinel.sh
```

It writes a marker file into your real `$HOME`, runs the network-isolated
`sentinel` container, and asserts the container **cannot** read the marker and
**cannot** reach the network. Exit code `0` means the sandbox is sound.

> The `backend` and `postgres` services in `docker-compose.yml` are scaffolded
> here but only become active from INFRA‑003/004 onward (they live behind the
> `backend` compose profile).

### Pre-commit hooks run in the sandbox too

The Husky `pre-commit` hook does **not** run eslint / prettier / type-check /
vitest / gitleaks on your host. It calls `scripts/run-hooks.sh`, which runs the
`hooks` compose service — the same isolated container (no `$HOME`/`~/.ssh`,
non-root, no network; the gitleaks binary is baked into the image at build
time). Auto-fixes from `lint-staged` land on your working tree and are
re-staged automatically.

- First commit after changing `Dockerfile.dev` rebuilds the image (cached after).
- Emergency bypass (accepts the supply-chain risk): `git commit --no-verify`.

---

## NPM Scripts Reference

All commands are run from the project root directory.

| Command                       | Description                                  | When to Use                          |
| ----------------------------- | -------------------------------------------- | ------------------------------------ |
| `npm install`                 | Install all dependencies                     | After cloning, after pulling changes |
| `npm run dev`                 | Start development server with hot reload     | Active development                   |
| `npm run build`               | Create production build in `dist/`           | Before deploying, to test prod build |
| `npm run preview`             | Preview production build locally             | Test the built app before deploying  |
| `npm run lint`                | Check code for style/quality issues          | Before committing                    |
| `npm run lint:fix`            | Auto-fix linting issues                      | Fix formatting problems              |
| `npm run type-check`          | Check TypeScript types                       | Catch type errors                    |
| `npm run test:unit`           | Run unit and integration tests               | During development, before commits   |
| `npm run test:unit:watch`     | Run tests in watch mode (re-runs on changes) | TDD workflow                         |
| `npm run test:unit:coverage`  | Run tests with coverage report               | Check test coverage                  |
| `npm run test:e2e`            | Run Playwright E2E tests                     | Before pushing, in CI                |
| `npm run test:e2e:ui`         | Run E2E tests with interactive UI            | Debugging E2E tests                  |
| `npm run secrets:scan`        | Scan entire git history for secrets          | Check for leaked credentials         |
| `npm run secrets:scan:staged` | Scan staged files for secrets                | Runs automatically on commit         |

### Common Workflows

**TDD Workflow:**

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Tests in watch mode
npm run test:unit:watch
```

**Before Committing:**

```bash
npm run lint
npm run type-check
npm run test:unit
```

**Full Test Suite:**

```bash
npm run lint && npm run type-check && npm run test:unit && npm run test:e2e
```

---

## Testing

### Test Types

| Type        | Tool                     | Location                      | Purpose                                |
| ----------- | ------------------------ | ----------------------------- | -------------------------------------- |
| Unit        | Vitest                   | `src/**/__tests__/*.test.ts`  | Test functions/components in isolation |
| Integration | Vitest + Testing Library | `tests/integration/*.test.ts` | Test component interactions            |
| E2E         | Playwright               | `tests/e2e/*.spec.ts`         | Test full user flows in real browser   |

### Writing Tests

**Unit Test Example:**

```typescript
// src/stores/__tests__/questionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuestionStore } from '../questionStore'

describe('questionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with all questions available', () => {
    const store = useQuestionStore()
    expect(store.availableQuestions.length).toBeGreaterThan(0)
  })
})
```

**E2E Test Example:**

```typescript
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Jet Lag/)
})
```

### Running Specific Tests

```bash
# Run tests matching a pattern
npm run test:unit -- questionStore

# Run a specific test file
npm run test:unit -- src/stores/__tests__/questionStore.test.ts

# Run E2E tests in headed mode (see the browser)
npm run test:e2e -- --headed

# Run specific E2E test
npm run test:e2e -- tests/e2e/home.spec.ts
```

### Test Coverage

```bash
npm run test:unit:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/index.html` in a browser to view.

---

## Git Workflow

### Branch Strategy

```
main (protected)
  ├── feature/FOUND-001-project-setup
  ├── feature/Q-001-question-model
  └── fix/timer-drift-issue
```

### Commit Workflow

Pre-commit hooks will automatically run when you commit:

```bash
git add .
git commit -m "feat: add question tracking store"

# Husky pre-commit hook runs:
# 1. Secret scanning (gitleaks) - blocks if secrets detected
# 2. ESLint on staged files
# 3. Prettier formatting check
# 4. TypeScript type check
# 5. Unit tests on changed files

# If any check fails, commit is blocked
# Fix issues and try again
```

### Commit Message Convention

```
type(scope): description

# Types:
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation only
# style:    Formatting, no code change
# refactor: Code change that neither fixes a bug nor adds a feature
# test:     Adding or updating tests
# chore:    Build process, dependencies, etc.

# Examples:
feat(questions): add question response timer
fix(timer): correct drift calculation when app backgrounds
test(cards): add unit tests for card draw logic
docs: update development guide with testing section
```

### Pull Request Workflow

```bash
# 1. Create feature branch
git checkout -b feature/Q-001-question-model

# 2. Make changes, commit (hooks run automatically)
git add .
git commit -m "feat(questions): add question data model"

# 3. Push branch
git push -u origin feature/Q-001-question-model

# 4. Create PR on GitHub
# CI runs automatically (lint, type-check, all tests)

# 5. If CI passes, merge PR
# 6. Netlify/Vercel auto-deploys from main
```

---

## CI/CD Pipeline

### GitHub Actions

CI runs automatically on:

- Every push to `main`
- Every pull request

**What CI Does:**

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - Checkout code
      - Setup Node.js
      - npm ci # Clean install dependencies
      - npm run secrets:scan # Secret scanning (blocks PR if secrets found)
      - npm run lint # Code quality
      - npm run type-check # TypeScript validation
      - npm run test:unit # Unit + integration tests
      - npm run test:e2e # Browser tests
```

### Branch Protection

Configure on GitHub (Settings → Branches → Add rule):

- Branch name pattern: `main`
- Require status checks to pass before merging
- Require branches to be up to date before merging

---

## Security: Secret Detection

This is a **public repository**. Automated secret detection prevents accidental credential leaks.

### How It Works

[Gitleaks](https://github.com/gitleaks/gitleaks) scans code for hardcoded secrets like API keys, tokens, and credentials.

- **Pre-commit hook:** Scans staged files before each commit
- **CI pipeline:** Scans entire codebase on every push and PR
- **Both block** if secrets are detected

### Running Secret Scans

```bash
# Scan entire codebase
npm run secrets:scan

# Scan staged files only (what pre-commit hook runs)
npm run secrets:scan:staged
```

### If Secrets Are Detected

**If it's a real secret:**

1. **DO NOT COMMIT.** The hook will block you automatically.
2. Remove the secret from your code.
3. Store secrets in environment variables instead.
4. If you accidentally committed a secret:
   - Revoke/rotate the credential immediately
   - Contact the service provider (e.g., regenerate API key)
   - Consider using `git filter-repo` to remove from history
   - Force push is required (coordinate with team)

**If it's a false positive:**

1. Run the scan to get the fingerprint:
   ```bash
   npm run secrets:scan
   ```
2. Copy the `Fingerprint` value from the output
3. Add it to `.gitleaksignore` with a comment explaining why it's safe:
   ```
   a1b2c3d4e5f6... # Test API key in unit test fixture (not real)
   ```

### What NOT to Commit

- API keys or tokens (even "test" ones from real services)
- Database connection strings
- Private keys (_.pem, _.key)
- Credential files (credentials.json, service-account.json)
- .env files with real values

### Environment Variables

For secrets your app needs:

1. Create `.env.example` with placeholder values (committed):

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Create `.env` with real values (gitignored):

   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. For CI/CD, use GitHub repository secrets (Settings → Secrets)

---

## Deployment

### Railway (multiplayer build — INFRA-007)

The multiplayer build deploys to **Railway** as one project with three services:

| Railway service | Build               | Role                              |
| --------------- | ------------------- | --------------------------------- |
| `web`           | `Dockerfile.web`    | static PWA (`serve -s dist`)      |
| `api`           | `server/Dockerfile` | Fastify + WebSocket gateway       |
| Postgres        | Railway plugin      | sessions/players (`DATABASE_URL`) |

Key env vars:

- `api`: `DATABASE_URL` (from the Postgres plugin), `WEB_ORIGIN` = the `web`
  public URL (locks CORS **and** the WS upgrade origin), `PORT`/`HOST` (Railway
  sets `PORT`; server binds `0.0.0.0`).
- `web`: `VITE_API_URL` = the `api` public URL (the client derives `wss://`
  from it).

**Single-instance constraint:** the `RoomHub` is in-memory, so keep `api` at 1
replica for v1 (Redis fan-out is future work).

Full step-by-step (account-linked actions are yours to run): see
[`deploy/railway.md`](deploy/railway.md).

These map 1:1 to the local `docker compose` services (`frontend`/`backend`/
`postgres`), so local and Railway stay in parity.

### Static-only deploy (single-device build)

The single-device build is a static site (just HTML/CSS/JS files). No server-side code runs in production.

```
npm run build
    ↓
Creates dist/ folder:
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── manifest.webmanifest
    ↓
Hosted as static files on Netlify/Vercel
```

### Netlify Setup

1. Connect GitHub repo to Netlify
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** Specify in environment or `.nvmrc`
3. Enable automatic deploys from `main` branch

**Environment Variables (if needed):**
Set in Netlify dashboard under Site Settings → Environment Variables.

### Vercel Setup

1. Import GitHub repo to Vercel
2. Vercel auto-detects Vite/Vue and configures:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Automatic deploys enabled by default

### Manual Deployment (if needed)

```bash
# Build locally
npm run build

# Preview locally before deploying
npm run preview

# Deploy dist/ folder to any static host
```

### Production Checklist

Before deploying to production:

- [ ] All tests pass (`npm run test:unit && npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Preview looks correct (`npm run preview`)
- [ ] Environment variables configured (if any)

---

## Troubleshooting

### Common Issues

**"npm: command not found"**

- Node.js not installed. See [Prerequisites](#prerequisites).

**"npm install" fails**

- Try deleting `node_modules` and `package-lock.json`:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**"EACCES permission denied"**

- Don't use `sudo` with npm. Fix npm permissions or use nvm.

**Playwright tests fail with browser errors**

- Reinstall browsers:
  ```bash
  npx playwright install
  ```

**Pre-commit hook fails**

- Run the failing check manually to see details:
  ```bash
  npm run secrets:scan:staged
  npm run lint
  npm run type-check
  npm run test:unit
  ```

**Secret detected (false positive)**

- See [Security: Secret Detection](#security-secret-detection) section for how to handle
- If legitimate false positive, add fingerprint to `.gitleaksignore`

**Port 5173 already in use**

- Kill the process or use a different port:
  ```bash
  npm run dev -- --port 3000
  ```

### Getting Help

- Vue.js docs: https://vuejs.org/guide/
- Vite docs: https://vitejs.dev/guide/
- Vitest docs: https://vitest.dev/guide/
- Playwright docs: https://playwright.dev/docs/intro
- Pinia docs: https://pinia.vuejs.org/
- Tailwind docs: https://tailwindcss.com/docs

---

## Quick Reference Card

```bash
# === SETUP ===
npm install                  # Install dependencies
npx playwright install       # Install E2E browsers

# === DEVELOPMENT ===
npm run dev                  # Start dev server
npm run test:unit:watch      # TDD mode

# === BEFORE COMMIT ===
npm run lint:fix             # Fix formatting
npm run test:unit            # Run tests

# === BEFORE PUSH ===
npm run test:e2e             # Full E2E tests

# === BUILD & DEPLOY ===
npm run build                # Create production build
npm run preview              # Test production build locally
```

---

_Last updated: January 2026_
