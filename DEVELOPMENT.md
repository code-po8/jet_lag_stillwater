# Development Guide

Complete guide for setting up, developing, testing, and deploying the Jet Lag Stillwater app.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [NPM Scripts Reference](#npm-scripts-reference)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [CI/CD Pipeline](#cicd-pipeline)
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

## NPM Scripts Reference

All commands are run from the project root directory.

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm install` | Install all dependencies | After cloning, after pulling changes |
| `npm run dev` | Start development server with hot reload | Active development |
| `npm run build` | Create production build in `dist/` | Before deploying, to test prod build |
| `npm run preview` | Preview production build locally | Test the built app before deploying |
| `npm run lint` | Check code for style/quality issues | Before committing |
| `npm run lint:fix` | Auto-fix linting issues | Fix formatting problems |
| `npm run type-check` | Check TypeScript types | Catch type errors |
| `npm run test:unit` | Run unit and integration tests | During development, before commits |
| `npm run test:unit:watch` | Run tests in watch mode (re-runs on changes) | TDD workflow |
| `npm run test:unit:coverage` | Run tests with coverage report | Check test coverage |
| `npm run test:e2e` | Run Playwright E2E tests | Before pushing, in CI |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI | Debugging E2E tests |

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

| Type | Tool | Location | Purpose |
|------|------|----------|---------|
| Unit | Vitest | `src/**/__tests__/*.test.ts` | Test functions/components in isolation |
| Integration | Vitest + Testing Library | `tests/integration/*.test.ts` | Test component interactions |
| E2E | Playwright | `tests/e2e/*.spec.ts` | Test full user flows in real browser |

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
# 1. ESLint on staged files
# 2. Prettier formatting check
# 3. TypeScript type check
# 4. Unit tests on changed files

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
      - npm ci              # Clean install dependencies
      - npm run lint        # Code quality
      - npm run type-check  # TypeScript validation
      - npm run test:unit   # Unit + integration tests
      - npm run test:e2e    # Browser tests
```

### Branch Protection

Configure on GitHub (Settings → Branches → Add rule):
- Branch name pattern: `main`
- Require status checks to pass before merging
- Require branches to be up to date before merging

---

## Deployment

### How It Works

The app is a static site (just HTML/CSS/JS files). No server-side code runs in production.

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
  npm run lint
  npm run type-check
  npm run test:unit
  ```

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

*Last updated: January 2026*
