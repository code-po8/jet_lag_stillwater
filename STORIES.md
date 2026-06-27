# Jet Lag Stillwater - Story Backlog

Stories are organized by epic. Each story includes acceptance criteria that map to test cases.

**Story Format:**

- **ID:** Unique identifier for referencing
- **Status:** `pending` | `in-progress` | `complete`
- **Story:** User story or technical task
- **Acceptance Criteria:** Testable requirements (become test cases)
- **Size:** S (< 2 hrs), M (2-4 hrs), L (4-8 hrs), XL (break it down)
- **Depends On:** List of card IDs that must be complete first

**Status Tracking:**

- When a card is started, change status to `in-progress`
- When a card is complete, change status to `complete`
- Only one card should be `in-progress` at a time

---

## Epic 0: Project Foundation

Infrastructure and tooling setup. Must be completed before feature work begins.

---

### FOUND-001: Initialize Vue 3 Project

**Status:** `complete`
**Depends On:** None

**Story:** As a developer, I need a Vue 3 project scaffold so that I have a foundation to build upon.

**Acceptance Criteria:**

- [x] Project created with `npm create vue@latest` (Vue 3, Vite, TypeScript, Pinia, Vue Router)
- [x] Tailwind CSS installed and configured
- [x] Project runs locally with `npm run dev`
- [x] Project builds without errors with `npm run build`
- [x] Default boilerplate removed, clean starting point

**Size:** S

---

### FOUND-002: Configure Vitest for Unit Testing

**Status:** `complete`
**Depends On:** FOUND-001

**Story:** As a developer, I need Vitest configured so that I can write and run unit tests.

**Acceptance Criteria:**

- [x] Vitest installed and configured
- [x] Vue Test Utils installed
- [x] `npm run test:unit` command runs tests
- [x] Test coverage reporting enabled (`npm run test:coverage`)
- [x] Sample unit test passes (e.g., test a simple utility function)
- [x] Tests run in watch mode during development (`npm run test:unit -- --watch`)

**Size:** S

---

### FOUND-003: Configure Testing Library for Integration Tests

**Status:** `complete`
**Depends On:** FOUND-002

**Story:** As a developer, I need Testing Library configured so that I can write user-centric integration tests.

**Acceptance Criteria:**

- [x] `@testing-library/vue` installed
- [x] `@testing-library/jest-dom` installed for extended matchers
- [x] Sample integration test passes (e.g., render a component, find by text, simulate click)
- [x] Integration tests run as part of `npm run test:unit`

**Size:** S

---

### FOUND-004: Configure Playwright for E2E Testing

**Status:** `complete`
**Depends On:** FOUND-001

**Story:** As a developer, I need Playwright configured so that I can write browser-based end-to-end tests.

**Acceptance Criteria:**

- [x] Playwright installed (`@playwright/test`)
- [x] Playwright config file created (`playwright.config.ts`)
- [x] `npm run test:e2e` command runs E2E tests
- [x] Tests run against local dev server
- [x] Sample E2E test passes (e.g., visit homepage, verify title)
- [x] HTML test report generated after runs

**Size:** M

**Tests Written (5 tests):**

```typescript
describe('Home Page', () => {
  test('should display the correct page title')
  test('should display the app header')
  test('should display the subtitle')
  test('should have a New Game button')
  test('should navigate to setup page when clicking New Game')
})
```

**Notes:**

- Tests run on both Chromium desktop and Pixel 5 mobile viewport (10 total test runs)
- HTML report generated in `playwright-report/` directory
- Config includes webServer option to auto-start dev server
- Added `test:e2e:ui` script for interactive Playwright UI mode

---

### FOUND-005: Configure Pre-Commit Hooks

**Status:** `complete`
**Depends On:** FOUND-002

**Story:** As a developer, I need pre-commit hooks so that code quality is enforced before commits.

**Acceptance Criteria:**

- [x] Husky installed and initialized
- [x] lint-staged installed and configured
- [x] Pre-commit hook runs: ESLint, Prettier, TypeScript check
- [x] Pre-commit hook runs unit tests on staged files
- [x] Commits are blocked if any check fails
- [x] Hook can be bypassed with `--no-verify` (for emergencies only)

**Size:** M

**Implementation Notes:**

- Husky v9 initialized with `.husky/pre-commit` hook
- lint-staged runs ESLint (with --fix) and Prettier on staged files
- TypeScript check runs via `npm run type-check` (vue-tsc --build)
- Unit tests run via `vitest related --run` on staged .ts/.vue files only
- Hook exits with error code 1 if any check fails, blocking commit
- Bypass available via `git commit --no-verify` for emergencies

---

### FOUND-006: Configure GitHub Actions CI

**Status:** `complete`
**Depends On:** FOUND-002, FOUND-004

**Story:** As a developer, I need a CI pipeline so that all tests run automatically on push and PR.

**Acceptance Criteria:**

- [x] `.github/workflows/ci.yml` created
- [x] CI triggers on: push to `main`, all pull requests
- [x] CI steps: install deps → lint → type check → unit tests → E2E tests
- [x] CI reports test results and coverage
- [ ] Failed CI blocks PR merge (branch protection rule) - requires manual GitHub settings
- [x] CI completes in reasonable time (< 5 minutes target)

**Size:** M

**Implementation Notes:**

- Workflow uses Node.js 22 with npm caching for fast installs
- Steps run sequentially: checkout → setup node → install → lint → type-check → unit tests → E2E tests
- Playwright installs only Chromium browser to minimize CI time
- Test results uploaded as artifacts (playwright-report) for debugging failures
- Branch protection rule must be configured manually in GitHub repository settings (Settings → Branches → Add rule)

---

### FOUND-007: Configure PWA Support

**Status:** `complete`
**Depends On:** FOUND-001

**Story:** As a developer, I need PWA configuration so that the app can be installed and work offline.

**Acceptance Criteria:**

- [x] `vite-plugin-pwa` installed and configured
- [x] Web app manifest created (name, icons, theme color, display mode)
- [x] Service worker registers successfully
- [x] App is installable (shows browser install prompt)
- [x] App loads offline after initial visit (cached assets)
- [x] Lighthouse PWA audit passes core requirements

**Size:** M

**Tests Written (18 E2E tests in pwa.spec.ts):**

```typescript
describe('PWA Support', () => {
  describe('Web App Manifest', () => {
    test('should have a valid manifest link in HTML')
    test('should serve manifest with correct MIME type')
    test('should have correct app name in manifest')
    test('should have correct theme colors in manifest')
    test('should have display mode set to standalone')
    test('should have all required icons in manifest')
    test('should have maskable icon for adaptive icons')
  })
  describe('Icons', () => {
    test('should serve 192x192 icon')
    test('should serve 512x512 icon')
    test('should serve apple-touch-icon')
  })
  describe('Service Worker', () => {
    test('should register service worker')
    test('should serve service worker file')
  })
  describe('Meta Tags', () => {
    test('should have theme-color meta tag')
    test('should have apple-mobile-web-app-capable meta tag')
    test('should have apple-touch-icon link')
    test('should have description meta tag')
  })
  describe('PWA Installability', () => {
    test('should meet basic installability criteria')
  })
  describe('Offline Support', () => {
    test('should cache static assets after initial load')
  })
})
```

**Implementation Notes:**

- vite-plugin-pwa v1.2.0 with registerType: 'autoUpdate'
- Manifest includes app name, theme color (#1a1a2e), standalone display, portrait orientation
- Icons generated: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png (180x180)
- Maskable icon included for Android adaptive icons
- Workbox configured with precache and runtime caching for fonts
- Dev mode SW enabled for testing during development
- PWA icon generation script: scripts/generate-pwa-icons.mjs (uses sharp)

---

### FOUND-008: Create Persistence Service Abstraction

**Status:** `complete`
**Depends On:** FOUND-002

**Story:** As a developer, I need a persistence service abstraction so that storage can be swapped from localStorage to Supabase later.

**Acceptance Criteria:**

- [x] `src/services/persistence.ts` created with interface
- [x] Interface includes: `save(key, data)`, `load(key)`, `remove(key)`, `clear()`
- [x] localStorage implementation created
- [x] Unit tests verify save/load/remove/clear operations
- [x] Service is injectable into Pinia stores

**Size:** S

**Tests to Write:**

```typescript
describe('PersistenceService', () => {
  it('should save and load data')
  it('should return null for missing keys')
  it('should remove data by key')
  it('should clear all data')
  it('should handle JSON serialization')
})
```

---

### FOUND-009: Secret Detection in Pre-Commit and CI

**Status:** `complete`
**Depends On:** FOUND-005, FOUND-006

**Story:** As a developer, I need automated secret detection so that credentials are never accidentally committed to this public repository.

**Acceptance Criteria:**

- [x] Secret scanning tool installed (e.g., gitleaks, truffleHog, or detect-secrets)
- [x] Pre-commit hook scans staged files for secrets
- [x] CI pipeline includes secret scanning step
- [x] Commits/PRs blocked if secrets detected
- [x] `.secretsignore` or equivalent for false positive exclusions
- [x] Documentation in DEVELOPMENT.md on how to handle detected secrets

**Size:** S

**Implementation Notes:**

- Installed `gitleaks-secret-scanner` npm wrapper for gitleaks v8.27.2
- Added `npm run secrets:scan` and `npm run secrets:scan:staged` scripts
- Pre-commit hook runs `secrets:scan:staged` before lint-staged
- CI workflow runs `secrets:scan` after dependency install
- Created `.gitleaksignore` for fingerprint-based false positive exclusions
- Added `.gitleaksignore` entry for documentation JWT example (false positive)
- Added "Security: Secret Detection" section to DEVELOPMENT.md with:
  - How secret detection works
  - How to handle detected secrets (real vs false positive)
  - What NOT to commit
  - Environment variable best practices

---

## Epic 1: Question Tracking

Core functionality for tracking questions during gameplay.

---

### Q-001: Define Question Data Model

**Status:** `complete`
**Depends On:** FOUND-001

**Story:** As a developer, I need a question data model so that questions can be stored and queried consistently.

**Acceptance Criteria:**

- [x] TypeScript interfaces defined for: `Question`, `QuestionCategory`, `AskedQuestion`
- [x] Question categories defined: Matching, Measuring, Radar, Thermometer, Photo, Tentacle (6 official categories)
- [x] Each category has draw/keep values and response times from official rulebook
- [x] `AskedQuestion` includes: question, answer, timestamp, category
- [x] Game size support (Small, Medium, Large) for filtering questions

**Size:** S

**Notes:**

- Updated from 5 placeholder categories to 6 official categories per rulebook
- Added `GameSize` enum and `availableIn` for game-size-specific questions
- Added `format` field to categories showing question template
- Added `responseTimeMinutes` (variable for Photo category by game size)

---

### Q-001a: Seed Question Data

**Status:** `complete`
**Depends On:** Q-001

**Story:** As a developer, I need the question database populated with all questions from the rulebook so that players can use them in-game.

**Acceptance Criteria:**

- [x] All questions from each category catalogued in a data file (`src/data/questions.ts`)
- [x] Questions sourced from official Jet Lag Hide & Seek rules
- [x] Data file is easily editable (TypeScript with typed exports)
- [x] Unit tests verify all categories have questions (39 tests)
- [x] Draw/keep values filled in from official rulebook
- [x] Response times per category from official rulebook
- [x] Game size filtering (Small/Medium/Large)
- [x] Stillwater-specific custom questions marked

**Size:** M

**Question Counts:**
| Category | Small | Medium | Large | Total |
|----------|-------|--------|-------|-------|
| Matching | 22 | 22 | 22 | 22 |
| Measuring | 20 | 20 | 20 | 20 |
| Radar | 10 | 10 | 10 | 10 |
| Thermometer | 3 | 4 | 5 | 5 |
| Photo | 6 | 14 | 18 | 18 |
| Tentacle | 0 | 4 | 8 | 8 |
| **Total** | **61** | **74** | **83** | **83** |

**Stillwater Custom Questions (4):**

- Matching: Quadrant (4th admin division), Restaurant, School
- Thermometer: 0.2 miles distance

---

### Q-002a: Question Store Core

**Status:** `complete`
**Depends On:** Q-001a, FOUND-002

**Story:** As a developer, I need a Pinia store to track question state so that both roles can see what's available and asked.

**Acceptance Criteria:**

- [x] Pinia store created: `questionStore`
- [x] Store tracks: all available questions, asked questions, pending question
- [x] `getAvailableQuestions(category?)` getter filters out asked questions
- [x] `hasPendingQuestion()` getter returns true if waiting for answer

**Size:** S

**Tests Written (16 tests):**

- `should initialize with all questions available`
- `should initialize with no asked questions`
- `should initialize with no pending question`
- `should return all questions when none asked`
- `should filter out asked questions from available`
- `should filter by category when specified`
- `should filter by both category and exclude asked`
- `should filter questions by game size`
- `should exclude large-only questions from small game size`
- `should include tentacle questions for medium game size`
- `should return false when no pending question`
- `should return true when there is a pending question`
- `should return question by id`
- `should return undefined for non-existent id`
- `should return stats for all categories`
- `should update stats when questions are asked`

---

### Q-002b: Question Store Actions

**Status:** `complete`
**Depends On:** Q-002a

**Story:** As a player, I need actions to ask, answer, and veto questions so that the game flow is tracked.

**Acceptance Criteria:**

- [x] `askQuestion(questionId)` marks question as pending, returns draw/keep values
- [x] `answerQuestion(questionId, answer)` records answer, moves to asked
- [x] `vetoQuestion(questionId)` returns question to available (hider still gets cards)
- [x] Prevent new questions while one is pending

**Size:** S

**Tests Written (15 tests):**

```typescript
describe('questionStore actions', () => {
  describe('askQuestion', () => {
    it('should mark a question as pending when asked')
    it('should return draw/keep values when question asked')
    it('should prevent new questions while one is pending')
    it('should prevent asking a question that was already asked')
    it('should return error for non-existent question')
    it('should set askedAt timestamp when question asked')
  })
  describe('answerQuestion', () => {
    it('should record answer and move question to asked')
    it('should set answeredAt timestamp when answered')
    it('should return error if question id does not match pending')
    it('should return error if no question is pending')
    it('should mark question as not vetoed when answered')
  })
  describe('vetoQuestion', () => {
    it('should return vetoed question to available')
    it('should return draw/keep values when vetoed (hider still gets cards)')
    it('should return error if question id does not match pending')
    it('should return error if no question is pending')
  })
})
```

---

### Q-002c: Question Store Persistence

**Status:** `complete`
**Depends On:** Q-002b, FOUND-008

**Story:** As a player, I need question state to persist so that I don't lose progress if the app closes.

**Acceptance Criteria:**

- [x] Store persists to localStorage via persistence service
- [x] Store rehydrates on app load
- [x] Pending question state preserved across restarts

**Size:** S

**Tests Written (6 tests):**

```typescript
describe('questionStore persistence', () => {
  it('should persist state to localStorage')
  it('should rehydrate state on load')
  it('should preserve pending question across restart')
  it('should convert date strings back to Date objects on rehydrate')
  it('should handle empty localStorage gracefully')
  it('should handle corrupted localStorage data gracefully')
})
```

---

### Q-003a: Question List Display

**Status:** `complete`
**Depends On:** Q-002a, FOUND-003

**Story:** As a player, I need to see all questions grouped by category so that I can browse what's available.

**Acceptance Criteria:**

- [x] Component displays questions grouped by category
- [x] Each category shows: name, draw/keep values
- [x] Questions show: text
- [x] Component is mobile-friendly (touch targets, scrollable)
- [x] Accessible from both hider and seeker views

**Size:** S

**Tests Written (8 tests):**

```typescript
describe('QuestionList', () => {
  describe('category display', () => {
    it('should display all categories')
    it('should display draw/keep values for each category')
  })
  describe('question display', () => {
    it('should show questions within each category')
    it('should display question text')
  })
  describe('category collapsing', () => {
    it('should show category headers that can be expanded/collapsed')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly category headers')
    it('should have a scrollable container')
  })
  describe('category stats', () => {
    it('should show question count for each category')
  })
})
```

---

### Q-003b: Question Status Indicators

**Status:** `complete`
**Depends On:** Q-003a, Q-002b

**Story:** As a player, I need to see question status (asked/available/pending) so that I know what can still be asked.

**Acceptance Criteria:**

- [x] Questions show: asked/available/pending status
- [x] Asked questions are visually distinct (grayed out, strikethrough, or hidden)
- [x] Pending question (awaiting answer) highlighted
- [x] Disable asking new questions while one is pending
- [x] Emit event when question selected

**Size:** S

**Design Reference:**

- See RESEARCH_NOTES.md "Question Icon Reference" - in the show, used/unavailable questions appear faded/grayed out

**Tests Written (7 tests):**

```typescript
describe('QuestionList status indicators', () => {
  it('should gray out asked questions')
  it('should highlight pending question')
  it('should disable selection while question is pending')
  it('should emit event when question selected')
  it('should show asked status indicator text')
  it('should show pending status indicator text')
  it('should not emit event when clicking asked question')
})
```

---

### Q-004a: Ask Question Modal

**Status:** `complete`
**Depends On:** Q-003b

**Story:** As a seeker, I need to select a question and confirm asking it so that the hider knows to respond.

**Acceptance Criteria:**

- [x] Tapping a question opens a confirmation modal
- [x] Modal shows: question text, category, draw/keep values
- [x] "Ask" button marks question as pending, starts response timer
- [x] "Cancel" button closes modal without asking
- [x] Once pending, modal for recording answer appears
- [x] Toast/notification confirms question was asked

**Size:** S

**Tests Written (15 tests):**

```typescript
describe('AskQuestionModal', () => {
  describe('modal display', () => {
    it('should not render when no question is provided')
    it('should render modal when question is provided')
    it('should display question text')
    it('should display category name')
    it('should display draw/keep values')
  })
  describe('confirmation flow', () => {
    it('should show Ask and Cancel buttons')
    it('should emit cancel event when Cancel button is clicked')
    it('should mark question as pending when Ask button is clicked')
    it('should emit asked event with draw/keep values when Ask button is clicked')
  })
  describe('answer recording', () => {
    it('should show answer input after question is asked')
    it('should show Submit Answer button after question is asked')
    it('should record answer when Submit Answer is clicked')
    it('should emit answered event when answer is submitted')
  })
  describe('toast/notification', () => {
    it('should show confirmation message after question is asked')
  })
  describe('pending question state', () => {
    it('should show answer mode when question is already pending')
  })
})
```

**Note:** Response timer integration (T-004) is a separate card.

---

### Q-004b: Answer and Veto/Randomize Handling

**Status:** `complete`
**Depends On:** Q-004a, CARD-002

**Story:** As a player, I need to record the answer and handle Veto/Randomize responses so that the game flow continues.

**Acceptance Criteria:**

- [x] "Submit Answer" records answer, triggers hider card draw
- [x] Hider can play Veto (returns question to available, still draws cards)
- [x] Hider can play Randomize (replaces with random question from same category)
- [x] Toast/notification confirms answer was recorded

**Size:** S

**Tests Written (12 tests):**

```typescript
describe('answer submission and card draw', () => {
  it('should emit cardDraw event when answer is submitted')
  it('should show confirmation toast when answer is recorded')
})
describe('veto handling', () => {
  it('should show Veto button when question is pending')
  it('should return question to available when Veto is clicked')
  it('should emit cardDraw event when Veto is clicked (hider still gets cards)')
  it('should emit vetoed event when Veto is clicked')
  it('should show confirmation when question is vetoed')
})
describe('randomize handling', () => {
  it('should show Randomize button when question is pending')
  it('should replace question with random question from same category')
  it('should emit randomized event with new question')
  it('should show the new question text after Randomize')
  it('should show confirmation when question is randomized')
})
```

**Additional Tests (6 tests in questionStore):**

```typescript
describe('randomizeQuestion', () => {
  it('should replace pending question with a different question from same category')
  it('should return the new question ID when randomized')
  it('should return error if question id does not match pending')
  it('should return error if no question is pending')
  it('should return error if no other questions available in same category')
  it('should preserve the original askedAt timestamp')
})
```

---

### Q-005: Question History View

**Status:** `complete`
**Depends On:** Q-002c

**Story:** As a player (hider or seeker), I need to see all previously asked questions and answers so that I can reference what's been revealed.

**Acceptance Criteria:**

- [x] View shows all asked questions in reverse chronological order
- [x] Each entry shows: question, answer, timestamp, category
- [x] Vetoed questions marked distinctly (returned to available)
- [x] List is scrollable
- [x] Tapping an entry shows full details (emits select event)
- [x] Option to filter by category
- [x] Accessible from both hider and seeker views

**Size:** M

**Tests Written (24 tests):**

```typescript
describe('QuestionHistory', () => {
  describe('display requirements', () => {
    it('should display the history container')
    it('should display a header')
    it('should show empty state when no questions asked')
  })
  describe('reverse chronological order', () => {
    it('should display questions in reverse chronological order (newest first)')
  })
  describe('entry display - question, answer, timestamp, category', () => {
    it('should display the question text')
    it('should display the answer')
    it('should display the timestamp')
    it('should display the category name')
  })
  describe('vetoed questions', () => {
    it('should mark vetoed questions distinctly')
    it('should show vetoed badge for vetoed questions')
    it('should not show vetoed badge for regular answered questions')
  })
  describe('scrollable list', () => {
    it('should have a scrollable container')
  })
  describe('entry details on tap', () => {
    it('should emit select event when entry is tapped')
    it('should have touch-friendly tap targets (min 44px)')
  })
  describe('category filter', () => {
    it('should display category filter options')
    it('should have "All" option selected by default')
    it('should filter questions when category is selected')
    it('should show all questions when "All" is selected')
    it('should only show categories with asked questions in filter')
  })
  describe('accessibility', () => {
    it('should have proper heading structure')
    it('should have proper ARIA labels for history items')
    it('should support keyboard navigation')
  })
  describe('mobile-friendly design', () => {
    it('should have proper spacing for touch targets')
    it('should be scrollable when content overflows')
  })
})
```

**Notes:**

- QuestionHistory component integrated into GamePlayView History tab
- Filters show only categories that have asked questions
- Dark theme styling consistent with rest of app
- Full keyboard navigation support

---

### Q-006: Re-ask Question with Double Cost

**Status:** `complete`
**Depends On:** Q-004b

**Story:** As a seeker, I need the option to re-ask a previously asked question at double the card cost so that I can get updated information.

**Acceptance Criteria:**

- [x] Previously asked questions show "Re-ask (2x cost)" option
- [x] Re-asking shows confirmation with doubled draw/keep values
- [x] Hider draws double the normal cards when re-asked question is answered
- [x] Re-asked questions tracked separately in history (marked as re-ask)
- [x] Vetoed questions can be re-asked at normal cost (not doubled)

**Size:** S

**Rules Reference:**

- See GAME_RULES.md "Re-asking" rule: "Questions cannot be re-asked unless seekers pay double cost (or hider used Veto)"

**Tests to Write:**

```typescript
describe('Re-ask Question', () => {
  it('should show re-ask option for previously asked questions')
  it('should display doubled card cost for re-asking')
  it('should grant double cards to hider when re-asked')
  it('should mark re-asked questions in history')
  it('should allow normal cost re-ask for vetoed questions')
})
```

---

## Epic 2: Timers

Game timing functionality.

---

### T-001: Create Timer Composable

**Status:** `complete`
**Depends On:** FOUND-002

**Story:** As a developer, I need a reusable timer composable so that timing logic is consistent across the app.

**Acceptance Criteria:**

- [x] `useTimer` composable created
- [x] Supports: start, stop, pause, resume, reset
- [x] Tracks elapsed time in milliseconds
- [x] Emits events at configurable intervals
- [x] Handles app backgrounding (calculates drift on resume)
- [x] Unit tests cover all timer states

**Size:** M

**Tests Written (34 tests):**

```typescript
describe('useTimer', () => {
  describe('initialization', () => {
    it('should start from zero')
    it('should initialize in stopped state')
    it('should initialize as not paused')
  })
  describe('start', () => {
    it('should set isRunning to true')
    it('should track elapsed time')
    it('should continue tracking time over multiple seconds')
    it('should not restart if already running')
  })
  describe('stop', () => {
    it('should set isRunning to false')
    it('should reset elapsed time to zero')
  })
  describe('pause and resume', () => {
    it('should set isPaused to true when paused')
    it('should keep isRunning true when paused')
    it('should stop tracking time when paused')
    it('should resume tracking time')
    it('should set isPaused to false when resumed')
    it('should do nothing if paused when not running')
    it('should do nothing if resumed when not paused')
  })
  describe('reset', () => {
    it('should reset elapsed to zero')
    it('should stop the timer')
    it('should clear paused state')
    it('should allow starting fresh after reset')
  })
  describe('tick events', () => {
    it('should emit tick events at default 100ms interval')
    it('should emit tick events at custom interval')
    it('should pass elapsed time to tick callback')
    it('should not emit tick events when paused')
    it('should resume tick events after unpause')
  })
  describe('app backgrounding', () => {
    it('should handle time drift when app resumes')
    it('should not adjust time if not running')
    it('should not adjust time if paused')
  })
  describe('countdown mode', () => {
    it('should count down from initial value')
    it('should not go below zero')
    it('should emit onComplete when countdown reaches zero')
    it('should auto-stop when countdown completes')
    it('should reset countdown to initial value on reset')
  })
  describe('cleanup', () => {
    it('should clear interval on stop')
  })
})
```

---

### T-002: Hiding Period Timer

**Status:** `complete`
**Depends On:** T-001, FOUND-003

**Story:** As a player (hider or seeker), I need a 30-minute hiding period countdown so that both sides know when seeking begins.

**Acceptance Criteria:**

- [x] Timer counts down from 30:00
- [x] Timer displays in MM:SS format
- [x] Timer visible on both hider and seeker views
- [x] Seekers are frozen during this period (can't move or ask questions)
- [x] Visual/audio alert at 5 minutes remaining
- [x] Visual/audio alert when timer expires (seeking begins)
- [x] Timer can be paused (game pause rule)
- [x] Timer state persists if app is closed

**Size:** M

**Tests Written (25 tests):**

```typescript
describe('HidingPeriodTimer', () => {
  describe('timer display', () => {
    it('should countdown from 30:00')
    it('should display time in MM:SS format')
    it('should update countdown as time passes')
    it('should be visible on both hider and seeker views')
  })
  describe('seeking freeze indicator', () => {
    it('should show freeze message for seekers during hiding period')
    it('should not show freeze message for hiders')
  })
  describe('5-minute warning alert', () => {
    it('should show visual alert at 5 minutes remaining')
    it('should emit warning event at 5 minutes remaining')
  })
  describe('timer expiration', () => {
    it('should show visual alert when timer expires')
    it('should emit complete event when timer expires')
    it('should display 00:00 when timer expires')
    it('should show "Seeking begins!" message when timer expires')
  })
  describe('pause functionality', () => {
    it('should display pause button')
    it('should pause timer when pause button clicked')
    it('should show resume button when paused')
    it('should resume timer when resume button clicked')
    it('should show paused indicator when timer is paused')
  })
  describe('persistence', () => {
    it('should persist timer state if app is closed')
  })
  describe('phase awareness', () => {
    it('should not display when not in hiding-period phase')
    it('should display when in hiding-period phase')
    it('should hide when phase transitions to seeking')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly pause button (min 44px)')
    it('should have large readable timer text')
  })
  describe('accessibility', () => {
    it('should have proper ARIA label for timer')
    it('should announce time remaining for screen readers')
  })
})
```

**Notes:**

- Audio alerts not implemented (visual only) - can be added in UX-003
- Timer integrated into both HiderView and SeekerView
- Uses persistence service for state restoration across app restarts

---

### T-003: Hiding Duration Timer

**Status:** `complete`
**Depends On:** T-001

**Story:** As a player, I need to track how long the hider has been hiding so that we can determine the winner.

**Acceptance Criteria:**

- [x] Timer counts up from 00:00:00
- [x] Timer starts when hiding period ends (seeking phase begins)
- [x] Timer stops when hider is found
- [x] Displays in HH:MM:SS format
- [x] Timer can be paused
- [x] Final time is recorded for scoring

**Size:** M

**Tests Written (29 tests):**

```typescript
describe('HidingDurationTimer', () => {
  describe('timer display', () => {
    it('should count up from 00:00:00')
    it('should display time in HH:MM:SS format')
    it('should track elapsed time as time passes')
    it('should track time beyond one hour')
  })
  describe('timer lifecycle', () => {
    it('should start when seeking phase begins')
    it('should continue running in end-game phase')
    it('should stop when hider is found')
  })
  describe('pause functionality', () => {
    it('should display pause button')
    it('should pause timer when pause button clicked')
    it('should show resume button when paused')
    it('should resume timer when resume button clicked')
    it('should show paused indicator when timer is paused')
    it('should hide pause button when timer is stopped (hider found)')
  })
  describe('final time for scoring', () => {
    it('should emit final-time event when hider is found')
    it('should expose elapsed time getter for scoring')
  })
  describe('persistence', () => {
    it('should persist timer state if app is closed')
    it('should handle time passed while app was closed')
  })
  describe('phase awareness', () => {
    it('should not display when in setup phase')
    it('should not display when in hiding-period phase')
    it('should display when in seeking phase')
    it('should display when in end-game phase')
    it('should display final time in round-complete phase')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly pause button (min 44px)')
    it('should have large readable timer text')
  })
  describe('accessibility', () => {
    it('should have proper ARIA label for timer')
    it('should announce elapsed time for screen readers')
  })
  describe('status messages', () => {
    it('should show seeking status during seeking phase')
    it('should show end-game status during end-game phase')
    it('should show found status in round-complete phase')
  })
})
```

---

### T-004: Question Response Timer

**Status:** `complete`
**Depends On:** T-001, Q-004

**Story:** As a player (seeker or hider), I need a countdown timer after a question is asked so that both sides know the response deadline.

**Acceptance Criteria:**

- [x] Timer starts when question is submitted
- [x] Countdown from 5:00 (or 10:00/20:00 for photo questions based on game size)
- [x] Timer visible on both hider and seeker views
- [x] Visual alert when time is running low (< 1 minute)
- [x] Notification when timer expires (emits expired event)
- [x] Timer clears when answer is recorded

**Size:** S

**Tests Written (26 tests):**

```typescript
describe('QuestionResponseTimer', () => {
  describe('visibility', () => {
    it('should not render when no question is pending')
    it('should render when a question is pending')
  })
  describe('timer countdown', () => {
    it('should countdown from 5:00 for standard questions')
    it('should countdown from 10:00 for photo questions in small/medium games')
    it('should countdown from 20:00 for photo questions in large games')
    it('should display time in MM:SS format')
    it('should update countdown as time passes')
  })
  describe('visibility on both views', () => {
    it('should be visible on hider view')
    it('should be visible on seeker view')
  })
  describe('low time alert', () => {
    it('should show visual alert when less than 1 minute remaining')
    it('should not show low time alert before threshold')
    it('should emit lowTime event when threshold is crossed')
  })
  describe('timer expiration', () => {
    it('should show visual alert when timer expires')
    it('should emit expired event when timer expires')
    it('should display 00:00 when timer expires')
    it('should show "Time expired!" message when timer expires')
  })
  describe('clearing timer on answer', () => {
    it('should hide timer when answer is recorded')
    it('should hide timer when question is vetoed')
  })
  describe('question category display', () => {
    it('should display the pending question category')
    it('should update category when different question is pending')
  })
  describe('role-specific messaging', () => {
    it('should show answer prompt for hider')
    it('should show waiting message for seeker')
  })
  describe('mobile-friendly design', () => {
    it('should have large readable timer text')
    it('should have touch-friendly container')
  })
  describe('accessibility', () => {
    it('should have proper ARIA label for timer')
    it('should have timer role')
  })
})
```

**Notes:**

- QuestionResponseTimer component integrated into both HiderView and SeekerView
- Response times based on category: 5min for standard, 10min for Photo (small/medium), 20min for Photo (large)
- Timer starts automatically when question becomes pending and clears when answered/vetoed
- Role-specific messaging: "Respond to the question" for hider, "Waiting for hider response" for seeker
- Visual low-time warning (orange border) and expired state (red border with message)

---

## Epic 4: Card Management (Hider)

Card tracking for the hider role.

---

### CARD-001: Define Card Data Model

**Status:** `complete`
**Depends On:** FOUND-001

**Story:** As a developer, I need card type definitions so that cards can be managed consistently.

**Acceptance Criteria:**

- [x] TypeScript interfaces for: `Card`, `TimeBonusCard`, `PowerupCard`, `CurseCard`, `TimeTrapCard`
- [x] All cards from rulebook catalogued
- [x] Card effects documented in data
- [x] **Time Bonus Cards:** Add minutes to hiding duration (5, 10, or 15 minutes)
- [x] **Powerup Cards:** Special abilities for hider (6 types: Veto, Randomize, Discard/Draw, Draw 1 Expand, Duplicate, Move)
- [x] **Curse Cards:** Impose restrictions on seekers (4 types: Action-to-Clear, Duration-Based, Until-Found, Dice-Based)
- [x] **Time Trap Cards (Expansion):** Designate station as trap, bonus if seekers visit

**Size:** M

**Notes:**

- Base game has 3 card types: Time Bonus, Powerup, Curse
- Time Trap is from expansion pack

**Tests Written (36 tests):**

```typescript
describe('CardType enum', () => {
  it('should define all four card types')
})
describe('PowerupType enum', () => {
  it('should define all six powerup types')
})
describe('CurseType enum', () => {
  it('should define all four curse types')
})
describe('TIME_BONUS_VALUES', () => {
  it('should contain 5, 10, and 15 minute values')
})
describe('TimeBonusCard interface', () => {
  it('should allow creating a valid time bonus card')
})
describe('PowerupCard interface', () => {
  it('should allow creating a valid powerup card')
})
describe('CurseCard interface', () => {
  it('should allow creating a duration-based curse card')
  it('should allow creating an action-to-clear curse card')
  it('should allow creating an until-found curse card')
})
describe('TimeTrapCard interface', () => {
  it('should allow creating a time trap card')
})
describe('POWERUP_CARDS', () => {
  it('should define all six powerup cards')
  it('should include Veto, Randomize, Discard/Draw, Draw 1 Expand, Duplicate, Move')
  it('should have all powerup cards with correct type')
})
describe('CURSE_CARDS', () => {
  it('should define curse cards')
  it('should have all curse cards with correct type')
  it('should have duration-based curses with durationMinutes')
  it('should have action-to-clear curses with clearCondition')
})
describe('TIME_TRAP_CARD', () => {
  it('should be a valid time trap card')
})
describe('getAllCards', () => {
  it('should return all cards from all types')
  it('should include cards of all types')
})
describe('getCardById', () => {
  it('should return the correct card')
  it('should return undefined for invalid ID')
})
describe('getCardsByType', () => {
  it('should return only time bonus cards')
  it('should return only powerup cards')
  it('should return only curse cards')
  it('should return only time trap cards')
})
describe('getTimeBonusCards', () => {
  it('should return all time bonus cards')
})
describe('getPowerupCards', () => {
  it('should return all powerup cards')
})
describe('getCurseCards', () => {
  it('should return all curse cards')
})
```

---

### CARD-002: Create Card Store

**Status:** `complete`
**Depends On:** CARD-001, FOUND-008

**Story:** As a hider, I need to track my hand of cards so that I know what I can play.

**Acceptance Criteria:**

- [x] Pinia store created: `cardStore`
- [x] Hand limit enforced (default 6, expandable)
- [x] `drawCards(count)` action adds random cards
- [x] `playCard(cardId)` action removes card from hand
- [x] `discardCard(cardId)` action removes without playing
- [x] Store persists to localStorage

**Size:** M

**Tests Written (42 tests):**

```typescript
describe('cardStore core', () => {
  describe('initialization', () => {
    it('should initialize with empty hand')
    it('should initialize with default hand limit of 6')
    it('should initialize with full deck')
    it('should initialize with no discarded cards')
  })
  describe('hand management getters', () => {
    it('should return current hand count')
    it('should return true when hand is full')
    it('should return false when hand is not full')
    it('should return available hand slots')
  })
  describe('card filtering getters', () => {
    it('should return time bonus cards in hand')
    it('should return powerup cards in hand')
    it('should return curse cards in hand')
    it('should calculate total time bonus value')
  })
})
describe('cardStore actions', () => {
  describe('drawCards', () => {
    it('should add cards to hand')
    it('should return drawn cards')
    it('should reduce deck size')
    it('should respect hand limit')
    it('should return error when deck is empty')
    it('should draw weighted by card quantities in deck')
    it('should assign unique instance IDs to each drawn card')
  })
  describe('playCard', () => {
    it('should remove card from hand')
    it('should return the played card')
    it('should add card to discard pile')
    it('should return error if card not in hand')
  })
  describe('discardCard', () => {
    it('should remove card from hand')
    it('should add card to discard pile')
    it('should return error if card not in hand')
  })
  describe('expandHandLimit', () => {
    it('should increase hand limit by specified amount')
    it('should default to increasing by 1')
  })
  describe('clearHand', () => {
    it('should remove all cards from hand')
    it('should add cleared cards to discard pile')
  })
  describe('reset', () => {
    it('should reset hand to empty')
    it('should reset hand limit to default')
    it('should reset deck to full size')
    it('should clear discard pile')
  })
})
describe('cardStore time bonus calculations', () => {
  it('should calculate total time bonus for small game')
  it('should calculate total time bonus for medium game')
  it('should calculate total time bonus for large game')
})
describe('cardStore persistence', () => {
  it('should persist state to localStorage')
  it('should rehydrate state on load')
  it('should preserve expanded hand limit across restart')
  it('should handle empty localStorage gracefully')
  it('should handle corrupted localStorage data gracefully')
})
```

---

### CARD-003: Card Hand Display

**Status:** `complete`
**Depends On:** CARD-002, FOUND-003

**Story:** As a hider, I need to see my current hand of cards so that I can plan plays.

**Acceptance Criteria:**

- [x] Cards displayed in a mobile-friendly layout
- [x] Each card shows: type, name, effect summary
- [x] Visual distinction between time bonus, powerup, curse
- [x] Hand limit indicator (e.g., "4/6 cards")
- [x] Tapping a card shows full details and play option

**Size:** M

**Tests Written (20 tests):**

```typescript
describe('CardHand', () => {
  describe('empty hand display', () => {
    it('should show empty state when hand is empty')
    it('should show hand limit indicator when empty')
  })
  describe('card display', () => {
    it('should display cards in hand')
    it('should show card type for each card')
    it('should show card name for each card')
    it('should show effect summary for powerup cards')
    it('should show effect summary for curse cards')
  })
  describe('visual distinction by card type', () => {
    it('should visually distinguish time bonus cards')
    it('should visually distinguish powerup cards')
    it('should visually distinguish curse cards')
  })
  describe('hand limit indicator', () => {
    it('should show current card count and limit')
    it('should update when hand limit is expanded')
    it('should indicate when hand is full')
  })
  describe('card selection and details', () => {
    it('should emit cardSelect event when card is tapped')
    it('should have touch-friendly card elements')
  })
  describe('mobile-friendly layout', () => {
    it('should render cards in a grid/scrollable layout')
    it('should be scrollable when many cards in hand')
  })
  describe('time bonus display', () => {
    it('should show bonus minutes for time bonus cards')
  })
  describe('accessibility', () => {
    it('should have proper ARIA labels')
    it('should support keyboard navigation')
  })
})
```

---

### CARD-004: Card Draw Simulation

**Status:** `complete`
**Depends On:** CARD-002

**Story:** As a hider, I need to draw cards when questions are answered so that I get new options.

**Acceptance Criteria:**

- [x] Draw count based on question category
- [x] Cards drawn from simulated deck (weighted random)
- [x] Animation/feedback when cards are drawn
- [x] Hand limit enforced (must discard if over)

**Size:** M

**Tests Written (29 tests):**

```typescript
describe('CardDrawModal', () => {
  describe('visibility', () => {
    it('should not render when drawnCards is empty')
    it('should render when drawnCards has cards')
  })
  describe('card display', () => {
    it('should display all drawn cards')
    it('should show card name for each drawn card')
    it('should show visual distinction for different card types')
  })
  describe('keep count display', () => {
    it('should display how many cards to keep')
    it('should display different keep counts correctly')
    it('should show selection counter (e.g., "0/1 selected")')
  })
  describe('card selection', () => {
    it('should allow selecting a card by clicking')
    it('should update selection counter when card is selected')
    it('should allow deselecting a card by clicking again')
    it('should prevent selecting more cards than keepCount')
    it('should allow selecting multiple cards when keepCount > 1')
  })
  describe('confirm button', () => {
    it('should display confirm button')
    it('should disable confirm button when not enough cards selected')
    it('should enable confirm button when correct number of cards selected')
    it('should emit confirm event with selected cards when clicked')
  })
  describe('auto-confirm when keepCount equals draw count', () => {
    it('should auto-select all cards when keepCount equals drawn count')
    it('should show all cards as selected in message when keep equals draw')
  })
  describe('animation feedback', () => {
    it('should show draw animation class when modal first appears')
    it('should show card reveal animation on each card')
  })
  describe('hand limit enforcement', () => {
    it('should show warning when kept cards would exceed hand limit')
    it('should indicate how many cards must be discarded to fit hand limit')
  })
  describe('header and instructions', () => {
    it('should show descriptive header')
    it('should show instructions for selection')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly card sizes (min 44px touch targets)')
    it('should have touch-friendly confirm button')
  })
  describe('accessibility', () => {
    it('should have proper ARIA labels for modal')
    it('should have proper ARIA labels for selectable cards')
  })
})
```

**Notes:**

- CardDrawModal component created with draw X, keep Y selection mechanic
- Integrated with SeekerView to trigger after question answered/vetoed
- Cards are drawn to hand, then player selects which to keep (unselected are discarded)
- Animations: fade-in for modal, staggered card reveal animation
- Full accessibility support with ARIA roles and keyboard navigation

---

### CARD-005: Time Bonus Calculator

**Status:** `complete`
**Depends On:** CARD-002

**Story:** As a hider, I need to see my total time bonus so that I know my potential score.

**Acceptance Criteria:**

- [x] Sum of all time bonus cards in hand
- [x] Displayed prominently on hider view
- [x] Updates when cards drawn or discarded

**Size:** S

**Tests Written (5 tests):**

```typescript
describe('time bonus display (CARD-005)', () => {
  it('should display total time bonus prominently')
  it('should show 0 min when no time bonus cards in hand')
  it('should display correct time bonus sum from cards in hand')
  it('should update display when cards are drawn')
  it('should update display when cards are discarded')
  it('should display the time bonus label')
})
```

**Notes:**

- Display implemented in HiderView.vue with green-styled prominent display
- Uses `totalTimeBonus(gameSize)` from cardStore computed property
- Auto-updates reactively via Vue computed property when cards change

---

### CARD-006a: Curse Display

**Status:** `complete`
**Depends On:** CARD-001, FOUND-003

**Story:** As a seeker, I need to see which curses are currently active so that I know what restrictions apply.

**Acceptance Criteria:**

- [x] Display list of active curses on seeker view
- [x] Each curse shows: name, description, clear condition
- [x] Until-found curses show as persistent (no clear option)
- [x] Hider can play curse card which adds it to seeker's active curse list

**Size:** S

**Tests Written (24 tests):**

```typescript
describe('CurseDisplay', () => {
  describe('empty state', () => {
    it('should show empty state when no active curses')
    it('should show the curses section header')
  })
  describe('curse list display', () => {
    it('should display active curses')
    it('should display multiple active curses')
    it('should show curse name')
    it('should show curse description')
    it('should show curse effect')
  })
  describe('clear condition display', () => {
    it('should show clear condition for action-based curses')
    it('should show blocks transit indicator for transit-blocking curses')
    it('should show duration for time-based curses')
    it('should show penalty for penalty curses')
  })
  describe('until-found curses', () => {
    it('should show persistent indicator for until-found curses')
    it('should not show clear button for until-found curses')
  })
  describe('playing curses from hider', () => {
    it('should add curse to active curses when hider plays curse card')
    it('should remove curse card from hand when played')
    it('should set activated timestamp when curse is played')
  })
  describe('curse count indicator', () => {
    it('should show count of active curses')
  })
  describe('visual styling', () => {
    it('should have distinct visual style for curses')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly elements')
    it('should be scrollable when many curses are active')
  })
  describe('accessibility', () => {
    it('should have proper heading structure')
    it('should have proper ARIA labels for curse items')
    it('should announce curse count to screen readers')
  })
  describe('persistence', () => {
    it('should persist active curses to localStorage')
  })
})
```

**Implementation Notes:**

- CurseDisplay component added to SeekerView (conditionally shown when curses are active)
- ActiveCurse type added to cardStore tracking: instanceId, curseId, name, description, effect, castingCost, blocksQuestions, blocksTransit, activatedAt, untilFound, durationMinutes, penaltyMinutes
- playCurseCard action added to cardStore - plays curse from hand and adds to activeCurses
- clearCurse action added to cardStore - removes curse from active curses
- Active curses persist to localStorage with date serialization

---

### CARD-006b: Curse Clearing

**Status:** `complete`
**Depends On:** CARD-006a, T-001

**Story:** As a seeker, I need curses to clear when conditions are met so that restrictions are lifted.

**Acceptance Criteria:**

- [x] Time-based curses show countdown timer (auto-clear when expired)
- [x] Action-based curses have "Mark Complete" button for manual clearing
- [x] Curse clears from list when condition is met
- [x] Visual/audio notification when curse is cleared

**Size:** S

**Tests Written (11 tests):**

```typescript
describe('curse clearing (CARD-006b)', () => {
  describe('time-based curse countdown', () => {
    it('should show countdown timer for time-based curses')
    it('should display remaining time in countdown format')
    it('should auto-clear time-based curse when countdown expires')
    it('should not show countdown for non-time-based curses')
  })
  describe('action-based curse manual clearing', () => {
    it('should show Mark Complete button for action-based curses')
    it('should clear curse when Mark Complete button is clicked')
    it('should not show Mark Complete button for time-based curses')
    it('should not show Mark Complete button for until-found curses')
  })
  describe('curse cleared notification', () => {
    it('should emit curse-cleared event when curse is cleared manually')
    it('should emit curse-cleared event when time-based curse expires')
    it('should show visual feedback when curse is cleared')
  })
})
```

**Notes:**

- Countdown timer displays remaining time in MM:SS format
- Timer updates every second and auto-clears expired curses
- CurseDisplay component emits `curseCleared` event with curse name and reason (manual/expired)
- Mark Complete button only shown for action-based curses (not time-based or until-found)
- Audio alerts not implemented (visual notification via event emission only)

---

### CARD-007a: Discard/Draw Powerup Effect

**Status:** `complete`
**Depends On:** CARD-002

**Story:** As a hider, I need to play the Discard/Draw powerup so that I can exchange unwanted cards for new ones.

**Acceptance Criteria:**

- [x] Discard/Draw card can be played from hand
- [x] UI allows selecting which cards to discard (multi-select)
- [x] After discarding, draw equal number of new cards
- [x] Confirmation before finalizing the play
- [x] Card removed from hand after playing
- [x] Visual feedback showing cards discarded and drawn

**Size:** S

**Rules Reference:**

- See GAME_RULES.md "Powerup Cards" section

**Tests Written (26 tests in PowerupDiscardDrawModal.spec.ts + 8 tests in cardStore):**

```typescript
describe('PowerupDiscardDrawModal', () => {
  describe('visibility', () => {
    it('should not render when powerupCard is null')
    it('should render when powerupCard is provided')
  })
  describe('header and instructions', () => {
    it('should display the powerup card name in header')
    it('should display instructions for Discard 1 Draw 2')
    it('should display instructions for Discard 2 Draw 3')
  })
  describe('card selection for discard', () => {
    it('should display all selectable cards')
    it('should allow selecting a card for discard')
    it('should allow deselecting a card')
    it('should prevent selecting more cards than required for Discard 1 Draw 2')
    it('should allow selecting two cards for Discard 2 Draw 3')
    it('should show selection counter')
    it('should update selection counter when card is selected')
  })
  describe('confirm button', () => {
    it('should display confirm button')
    it('should disable confirm button when not enough cards selected')
    it('should enable confirm button when correct number of cards selected')
    it('should emit confirm event with selected cards when clicked')
  })
  describe('cancel button', () => {
    it('should display cancel button')
    it('should emit cancel event when clicked')
  })
  describe('not enough cards warning', () => {
    it('should show warning when not enough cards to play Discard 2 Draw 3')
    it('should not show warning when enough cards available')
  })
  describe('draw count display', () => {
    it('should display how many cards will be drawn for Discard 1 Draw 2')
    it('should display how many cards will be drawn for Discard 2 Draw 3')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly card sizes (min 44px)')
    it('should have touch-friendly confirm button')
  })
  describe('accessibility', () => {
    it('should have proper ARIA labels for modal')
    it('should have proper ARIA labels for selectable cards')
  })
})
describe('cardStore discardAndDraw', () => {
  it('should discard selected cards and draw new ones')
  it('should return the drawn cards')
  it('should add discarded cards to discard pile')
  it('should return error if any card not in hand')
  it('should return error if deck is empty and cannot draw')
  it('should work with Discard 1 Draw 2 scenario')
  it('should work with Discard 2 Draw 3 scenario')
  it('should respect hand limit when drawing')
})
```

**Notes:**

- Supports both Discard 1 Draw 2 and Discard 2 Draw 3 powerup variants
- PowerupDiscardDrawModal component handles card selection UI
- discardAndDraw action in cardStore handles the discard/draw logic
- Integrated into HiderView via card selection handling

---

### CARD-007b: Draw 1, Expand Powerup Effect

**Status:** `complete`
**Depends On:** CARD-002

**Story:** As a hider, I need to play the Draw 1, Expand powerup so that I can draw a card and permanently increase my hand size.

**Acceptance Criteria:**

- [x] Draw 1, Expand card can be played from hand
- [x] Playing draws one card immediately
- [x] Hand limit permanently increased by 1 (persists for rest of game)
- [x] Hand limit indicator updates to show new limit
- [x] Confirmation before playing
- [x] Card removed from hand after playing

**Size:** S

**Rules Reference:**

- See GAME_RULES.md "Powerup Cards" section

**Tests Written (21 tests):**

```typescript
describe('PowerupDrawExpandModal', () => {
  describe('visibility', () => {
    it('should not render when powerupCard is null')
    it('should render when powerupCard is provided')
  })
  describe('header and content', () => {
    it('should display the powerup card name in header')
    it('should display the card effect description')
    it('should show current hand limit')
    it('should show new hand limit after playing')
  })
  describe('confirm button', () => {
    it('should display confirm button')
    it('should emit confirm event when clicked')
  })
  describe('cancel button', () => {
    it('should display cancel button')
    it('should emit cancel event when clicked')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly confirm button (min 44px)')
    it('should have touch-friendly cancel button (min 44px)')
  })
  describe('accessibility', () => {
    it('should have proper ARIA labels for modal')
  })
})
describe('cardStore playDrawExpandPowerup', () => {
  it('should draw one card when played')
  it('should increase hand limit by 1')
  it('should persist increased hand limit')
  it('should remove powerup card after playing')
  it('should add powerup card to discard pile')
  it('should return error if card not in hand')
  it('should return error if card is not a DrawExpand powerup')
  it('should handle empty deck gracefully')
})
```

**Notes:**

- PowerupDrawExpandModal component created with confirmation UI
- Shows current hand limit → new hand limit visual
- playDrawExpandPowerup action added to cardStore
- Integrated into HiderView with card selection handling

---

### CARD-007c: Duplicate Powerup Effect

**Status:** `complete`
**Depends On:** CARD-002

**Story:** As a hider, I need to play the Duplicate powerup so that I can copy another card in my hand.

**Acceptance Criteria:**

- [x] Duplicate card can be played from hand
- [x] UI allows selecting which card in hand to copy
- [x] Creates a copy of the selected card in hand
- [x] If duplicating a time bonus, the copy has doubled value
- [x] Confirmation before playing
- [x] Original Duplicate card removed after playing

**Size:** S

**Rules Reference:**

- See GAME_RULES.md "Powerup Cards" section
- Duplicate can copy any time bonus, doubling its value

**Tests Written (36 tests in PowerupDuplicateModal.spec.ts):**

```typescript
describe('PowerupDuplicateModal', () => {
  describe('visibility', () => {
    it('should not render when powerupCard is null')
    it('should render when powerupCard is provided')
  })
  describe('header and instructions', () => {
    it('should display the powerup card name in header')
    it('should display instructions for selecting a card to copy')
  })
  describe('card selection', () => {
    it('should display all selectable cards')
    it('should allow selecting a card to duplicate')
    it('should allow deselecting a card')
    it('should only allow selecting one card at a time')
    it('should show selection indicator when card is selected')
  })
  describe('time bonus duplication display', () => {
    it('should show doubled time bonus value for time bonus cards')
    it('should show "creates copy" indicator for non-time-bonus cards')
    it('should show correct doubled value for different tiers')
    it('should update doubled value based on game size')
  })
  describe('confirm button', () => {
    it('should display confirm button')
    it('should disable confirm button when no card is selected')
    it('should enable confirm button when a card is selected')
    it('should emit confirm event with selected card when clicked')
  })
  describe('cancel button', () => {
    it('should display cancel button')
    it('should emit cancel event when clicked')
  })
  describe('not enough cards warning', () => {
    it('should show warning when no other cards available to duplicate')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly card sizes (min 44px)')
    it('should have touch-friendly confirm button (min 44px)')
  })
  describe('accessibility', () => {
    it('should have proper ARIA labels for modal')
    it('should have proper ARIA labels for selectable cards')
  })
})
describe('cardStore playDuplicatePowerup', () => {
  it('should create a copy of the selected card')
  it('should double time bonus value when duplicating time bonus card')
  it('should create exact copy for non-time-bonus cards')
  it('should remove duplicate powerup card from hand after playing')
  it('should add duplicate powerup card to discard pile')
  it('should assign unique instance ID to duplicated card')
  it('should keep original card in hand after duplication')
  it('should return error if duplicate powerup card not in hand')
  it('should return error if target card not in hand')
  it('should return error if card is not a Duplicate powerup')
  it('should return error if trying to duplicate itself')
  it('should mark duplicated time bonus card as doubled')
})
```

**Notes:**

- PowerupDuplicateModal component created with single-select UI for target card
- Time bonus cards show original value and doubled value preview
- Non-time-bonus cards show "Creates copy" indicator
- playDuplicatePowerup action added to cardStore
- Duplicated time bonus cards have doubled bonusMinutes values and "(Doubled)" suffix in name
- Integrated into HiderView via card selection handling

---

### CARD-007d: Move Powerup Effect

**Status:** `complete`
**Depends On:** CARD-002, GS-001, T-003

**Story:** As a hider, I need to play the Move powerup so that I can establish a new hiding zone while seekers wait.

**Acceptance Criteria:**

- [x] Move card can be played from hand
- [x] Playing pauses the hiding duration timer
- [x] Seekers view shows notification: "Hider is moving - stay put"
- [x] Hider can travel to new location and establish new hiding zone
- [x] "Confirm New Zone" action resumes hiding timer
- [x] Move state persists if app is closed mid-move
- [x] Card removed from hand after playing

**Size:** M

**Rules Reference:**

- See GAME_RULES.md "Powerup Cards" section
- Move allows establishing new hiding zone; hiding timer pauses, seekers must stay put

**Tests to Write:**

```typescript
describe('Move Powerup', () => {
  it('should pause hiding timer when played')
  it('should notify seekers to stay put')
  it('should allow establishing new hiding zone')
  it('should resume timer when new zone confirmed')
  it('should persist move state across app restart')
})
```

---

### CARD-008: Time Trap Card Implementation

**Status:** `complete`
**Depends On:** CARD-002, GS-001

**Story:** As a hider, I need to play Time Trap cards to designate stations as traps so that I gain bonus time if seekers visit them.

**Acceptance Criteria:**

- [x] Time Trap card can be played from hand
- [x] Playing prompts hider to select/enter a transit station name
- [x] Trapped station is publicly announced (seekers see it)
- [x] If seekers visit trapped station, hider gains bonus time (15 minutes)
- [x] "Triggered" traps show as triggered with time bonus applied
- [x] Multiple traps can be active simultaneously
- [x] Traps persist across app restarts

**Size:** M

**Rules Reference:**

- See GAME_RULES.md "Time Trap Cards (Expansion Pack)" section
- Can be used as misdirection (trap a station far from hiding spot)

**Tests Written (63 tests):**

```typescript
describe('cardStore Time Trap functionality (CARD-008)', () => {
  describe('activeTimeTraps initialization', () => {
    it('should initialize with empty active time traps')
  })
  describe('playTimeTrapCard', () => {
    it('should remove Time Trap card from hand')
    it('should add Time Trap card to discard pile')
    it('should add trap to active time traps with station name')
    it('should set isTriggered to false when trap is created')
    it('should set bonus minutes on the trap')
    it('should assign unique instance ID to trap')
    it('should set createdAt timestamp')
    it('should allow multiple traps to be active simultaneously')
    it('should return error if card not in hand')
    it('should return error if card is not a Time Trap')
    it('should return error if station name is empty')
    it('should return error if station name is only whitespace')
    it('should return the played card')
  })
  describe('triggerTimeTrap', () => {
    it('should mark trap as triggered')
    it('should set triggeredAt timestamp')
    it('should return bonus minutes when triggered')
    it('should return error if trap not found')
    it('should return error if trap already triggered')
  })
  describe('getActiveTraps getter', () => {
    it('should return only untriggered traps when filtered')
    it('should return only triggered traps when filtered')
  })
  describe('totalTimeTrapBonus getter', () => {
    it('should return 0 when no traps have been triggered')
    it('should return sum of triggered trap bonuses')
  })
  describe('reset clears time traps', () => {
    it('should clear active time traps on reset')
  })
})

describe('TimeTrapModal', () => {
  describe('visibility', () => {
    it('should not render when timeTrapCard is null')
    it('should render when timeTrapCard is provided')
  })
  describe('header and content', () => {
    it('should display the card name in header')
    it('should display instructions for entering station name')
    it('should display the bonus minutes')
  })
  describe('station name input', () => {
    it('should have an input field for station name')
    it('should allow typing in the station name input')
    it('should have a placeholder text')
  })
  describe('confirm button', () => {
    it('should display confirm button')
    it('should disable confirm button when station name is empty')
    it('should enable confirm button when station name is entered')
    it('should emit confirm event with station name when clicked')
    it('should not emit confirm when station name is only whitespace')
  })
  describe('cancel button', () => {
    it('should display cancel button')
    it('should emit cancel event when clicked')
  })
  describe('mobile-friendly design', () => {
    // touch-friendly button tests
  })
  describe('accessibility', () => {
    // ARIA label tests
  })
  describe('trap information display', () => {
    it('should display that trap is publicly visible')
    it('should explain what happens when trap is triggered')
  })
})

describe('TimeTrapDisplay', () => {
  describe('with no traps', () => {
    it('should not render when traps array is empty')
  })
  describe('with active traps', () => {
    it('should render when there are traps')
    it('should display all traps')
    it('should show header indicating active traps')
    it('should display station name for each trap')
    it('should show bonus minutes for untriggered traps')
  })
  describe('triggered vs untriggered traps', () => {
    it('should visually differentiate untriggered traps')
    it('should visually differentiate triggered traps')
    it('should show triggered indicator for triggered traps')
  })
  describe('hider vs seeker view', () => {
    it('should show trigger button for seekers on untriggered traps')
    it('should not show trigger button for hiders')
    it('should not show trigger button for already triggered traps')
    it('should emit trigger event when seeker clicks trigger button')
  })
})
```

---

## Epic 5: Game State

Overall game flow management.

---

### GS-001: Create Game Store

**Status:** `complete`
**Depends On:** FOUND-008

**Story:** As a player, I need game state tracked so that the app knows the current phase and active players.

**Acceptance Criteria:**

- [x] Pinia store created: `gameStore`
- [x] Tracks: current phase, current hider, round number, player list
- [x] Phases: setup, hiding-period, seeking, end-game, round-complete
- [x] `startRound(hiderId)` action initiates hiding period
- [x] `endRound()` action records hider time and rotates
- [x] Store persists to localStorage

**Size:** M

**Tests Written (37 tests):**

```typescript
describe('gameStore core', () => {
  describe('initialization', () => {
    it('should initialize with setup phase')
    it('should initialize with no current hider')
    it('should initialize at round 0')
    it('should initialize with empty player list')
  })
  describe('player management', () => {
    it('should add players')
    it('should assign unique IDs to players')
    it('should remove players by ID')
    it('should get player by ID')
    it('should return undefined for non-existent player ID')
  })
  describe('currentHider getter', () => {
    it('should return null when no hider is set')
    it('should return the current hider player object')
  })
  describe('seekers getter', () => {
    it('should return empty array when no players')
    it('should return all players except current hider')
  })
})
describe('gameStore phase transitions', () => {
  describe('startRound', () => {
    it('should transition from setup to hiding-period')
    it('should set the current hider')
    it('should increment round number')
    it('should require at least 2 players')
    it('should reject invalid player ID as hider')
    it('should mark player as having been hider')
  })
  describe('startSeeking', () => {
    it('should transition from hiding-period to seeking')
    it('should fail if not in hiding-period phase')
  })
  describe('enterHidingZone', () => {
    it('should transition from seeking to end-game')
    it('should fail if not in seeking phase')
  })
  describe('hiderFound', () => {
    it('should transition from end-game to round-complete')
    it('should fail if not in end-game phase')
  })
  describe('endRound', () => {
    it('should record hider time')
    it('should transition back to setup for next round')
    it('should fail if not in round-complete phase')
    it('should accumulate hiding time across multiple rounds')
  })
})
describe('gameStore getters', () => {
  it('should return false when not all players have been hider')
  it('should return true when all players have been hider')
  it('should rank players by total hiding time descending')
  it('should return players who havent been hider yet')
})
describe('gameStore persistence', () => {
  it('should persist state to localStorage')
  it('should rehydrate state on load')
  it('should handle empty localStorage gracefully')
  it('should handle corrupted localStorage data gracefully')
})
```

---

### GS-002: Game Setup Flow

**Status:** `complete`
**Depends On:** GS-001, FOUND-003

**Story:** As a player, I need to set up a new game so that tracking can begin.

**Acceptance Criteria:**

- [x] Enter player names (2-4 players)
- [x] Select game size (Small for Stillwater)
- [x] Randomize or select first hider
- [x] Confirmation before starting

**Size:** M

**Tests Written (27 tests):**

```typescript
describe('GameSetupView', () => {
  describe('player management', () => {
    it('should display player name input')
    it('should display add player button')
    it('should add player when name is entered and add button clicked')
    it('should display added players in a list')
    it('should clear input after adding player')
    it('should allow removing a player')
    it('should limit players to 4 maximum')
    it('should require at least 2 players to start')
    it('should not add empty player names')
    it('should trim whitespace from player names')
  })
  describe('game size selection', () => {
    it('should display game size options')
    it('should default to Small game size for Stillwater')
    it('should allow selecting a game size')
  })
  describe('hider selection', () => {
    it('should display hider selection options after players are added')
    it('should allow selecting a player as hider')
    it('should have a randomize button for hider selection')
    it('should select a random player when randomize is clicked')
  })
  describe('game start', () => {
    it('should display start game button')
    it('should require a hider to be selected before starting')
    it('should start game and transition to hiding-period phase after confirmation')
    it('should show confirmation before starting game')
    it('should not start game if confirmation is cancelled')
    it('should start game when confirmation is approved')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes')
    it('should be scrollable when content overflows')
  })
  describe('accessibility', () => {
    it('should have proper heading structure')
    it('should have proper form labels')
  })
})
```

---

### GS-003: Role-Based Views

**Status:** `complete`
**Depends On:** GS-001, Q-003b, CARD-003

**Story:** As a player, I need to see information relevant to my current role (hider or seeker).

**Acceptance Criteria:**

- [x] Hider view shows: cards, time bonus, GPS toggle (future)
- [x] Seeker view shows: questions, answers, timers
- [x] Easy toggle to switch views (for single-device play)
- [x] Current role clearly indicated in UI

**Size:** M

**Tests Written (24 tests):**

```typescript
describe('HiderView', () => {
  describe('card display', () => {
    it('should display the CardHand component')
    it('should show cards in hand')
  })
  describe('time bonus display', () => {
    it('should display total time bonus prominently')
  })
  describe('hider-specific information', () => {
    it('should show current hiding phase status')
    it('should display hider role indicator')
  })
})

describe('SeekerView', () => {
  describe('question display', () => {
    it('should display the QuestionList component')
    it('should show question list container')
  })
  describe('answer history', () => {
    it('should show previously answered questions summary')
  })
  describe('seeker-specific information', () => {
    it('should show current seeking phase status')
    it('should display seeker role indicator')
  })
})

describe('GamePlayView (role toggle)', () => {
  describe('role toggle functionality', () => {
    it('should display role toggle buttons')
    it('should have hider toggle button')
    it('should have seeker toggle button')
    it('should switch to HiderView when hider toggle is clicked')
    it('should switch to SeekerView when seeker toggle is clicked')
    it('should highlight the currently active role')
  })
  describe('role indication in UI', () => {
    it('should clearly show current role in header')
    it('should update role display when toggle is clicked')
  })
  describe('phase display', () => {
    it('should show hiding-period status when in hiding period')
    it('should show seeking status when in seeking phase')
    it('should show end-game status when in end game phase')
  })
  describe('player information', () => {
    it('should display current hider name')
    it('should display seeker names')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly toggle buttons (min 44px)')
  })
})
```

---

### GS-004: Round Summary

**Status:** `complete`
**Depends On:** GS-001, T-003

**Story:** As a player, I need to see a summary when a round ends so that scores are clear.

**Acceptance Criteria:**

- [x] Shows hider's final hiding time
- [x] Shows time bonuses applied
- [x] Shows total score for round
- [x] Running leaderboard of all players
- [x] Option to start next round or end game

**Size:** M

**Tests Written (25 tests):**

```typescript
describe('RoundSummary', () => {
  describe('visibility based on phase', () => {
    it('should only display in round-complete phase')
    it('should not display in seeking phase')
  })
  describe('final hiding time display', () => {
    it('should display the hiders final hiding time')
    it('should format time correctly for under an hour')
    it('should format time correctly for multiple hours')
  })
  describe('time bonuses applied', () => {
    it('should display total time bonus from cards')
    it('should show zero bonus when no time bonus cards')
    it('should calculate time bonus based on game size')
  })
  describe('total score for round', () => {
    it('should display total round score (hiding time + time bonus)')
    it('should show score label')
  })
  describe('running leaderboard', () => {
    it('should display all players ranked by total hiding time')
    it('should show rank numbers for players')
    it('should highlight the current hiders result')
  })
  describe('current hider display', () => {
    it('should show hiders name prominently')
  })
  describe('next round button', () => {
    it('should show Start Next Round button when not all players have been hider')
    it('should emit start-next-round event when button is clicked and confirmed')
    it('should call gameStore.endRound with hiding time when starting next round')
  })
  describe('end game button', () => {
    it('should show End Game button when all players have been hider')
    it('should emit end-game event when End Game button is clicked')
    it('should not show End Game button when not all players have been hider')
  })
  describe('round number display', () => {
    it('should display current round number')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)')
    it('should be scrollable when content overflows')
  })
  describe('accessibility', () => {
    it('should have proper heading structure')
    it('should have proper ARIA labels for buttons')
  })
})
```

---

### GS-005: End Game Flow

**Status:** `complete`
**Depends On:** GS-001, T-003

**Story:** As a player, I need the app to handle the end game sequence so that rounds conclude properly when the hider is found.

**Acceptance Criteria:**

- [x] "Enter Hiding Zone" action triggers end game phase
- [x] End game phase shows: seekers are in zone, searching for hider
- [x] "Hider Found" action stops the hiding duration timer
- [x] Records final hiding time for scoring
- [x] Transitions to round-complete phase (triggers GS-004 Round Summary)
- [x] Enforces rule: Photo/Tentacles questions disabled during end game phase

**Size:** M

**Rules Reference:**

- See GAME_RULES.md "End Game" section
- Triggered when seekers enter hiding zone and leave transit
- Seekers must spot hider AND be within 5 feet to win

**Tests Written (37 tests):**

```typescript
describe('EndGameControls', () => {
  describe('visibility based on phase', () => {
    it('should display Enter Hiding Zone button in seeking phase')
    it('should not display Enter Hiding Zone button in hiding-period phase')
    it('should display Hider Found button in end-game phase')
    it('should not display Hider Found button in seeking phase')
    it('should not display any buttons in round-complete phase')
  })
  describe('Enter Hiding Zone action', () => {
    it('should transition to end-game phase when Enter Hiding Zone is clicked and confirmed')
    it('should emit enter-zone event when button is clicked and confirmed')
    it('should show confirmation dialog before entering hiding zone')
  })
  describe('Hider Found action', () => {
    it('should transition to round-complete phase when Hider Found is clicked and confirmed')
    it('should emit hider-found event when button is clicked and confirmed')
    it('should show confirmation dialog before marking hider found')
  })
  describe('end-game status display', () => {
    it('should show seekers in zone message during end-game phase')
    it('should show zone entry message when transitioning from seeking')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)')
  })
  describe('accessibility', () => {
    it('should have proper ARIA labels for buttons')
  })
})
describe('QuestionList end-game phase restrictions', () => {
  it('should disable Photo questions during end-game phase')
  it('should disable Tentacle questions during end-game phase')
  it('should show disabled indicator for Photo category in end-game phase')
  it('should show disabled indicator for Tentacle category in end-game phase')
  it('should not emit event when clicking Photo question during end-game')
  it('should allow other question types during end-game phase')
  it('should enable Photo/Tentacle questions in seeking phase')
})
```

**Notes:**

- EndGameControls component added with confirmation dialogs for Enter Hiding Zone and Hider Found actions
- HidingDurationTimer already integrated to stop when phase transitions to round-complete
- QuestionList updated to disable Photo and Tentacle categories during end-game phase

---

### GS-006: Multi-Round Scoring & Winner Declaration

**Status:** `complete`
**Depends On:** GS-004

**Story:** As a player, I need the app to track scores across all rounds and declare a winner so that we know who won the game.

**Acceptance Criteria:**

- [x] Track total hiding time per player across all rounds
- [x] Track which players have been hider (rotation tracking)
- [x] "End Game" option available after all players have been hider
- [x] Final results screen shows all players ranked by total time
- [x] Winner clearly announced (longest total hiding time)
- [x] Option to start new game or return to setup

**Size:** S

**Tests Written (22 tests):**

```typescript
describe('FinalResults', () => {
  describe('display requirements', () => {
    it('should display the final results container')
    it('should show a celebratory header')
  })
  describe('final leaderboard', () => {
    it('should display all players ranked by total hiding time')
    it('should rank players correctly - highest time first')
    it('should show rank numbers (1st, 2nd, 3rd)')
    it('should display total hiding time for each player')
  })
  describe('winner announcement', () => {
    it('should clearly announce the winner')
    it('should show the winner name prominently')
    it('should show the winning time')
    it('should have a trophy or winner indicator')
    it('should highlight the winner in the leaderboard')
  })
  describe('game statistics', () => {
    it('should show total number of rounds played')
    it('should show total game time')
  })
  describe('action buttons', () => {
    it('should show New Game button')
    it('should emit new-game event when New Game button is clicked')
    it('should show Return Home button')
    it('should emit return-home event when Return Home button is clicked')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)')
    it('should be scrollable when content overflows')
  })
  describe('accessibility', () => {
    it('should have proper heading structure')
    it('should have proper ARIA labels for buttons')
    it('should announce winner to screen readers')
  })
})
describe('gameStore resetGame action', () => {
  it('should reset phase to setup')
  it('should clear all players')
  it('should reset round number to 0')
  it('should clear current hider')
  it('should clear localStorage persistence')
})
```

**Notes:**

- FinalResults component displays winner with trophy icons and medals (🏆🥇🥈🥉)
- Game statistics show total rounds and combined hiding time
- New Game button resets all stores (game, card, question)
- Added gameStore.resetGame() and questionStore.reset() actions
- Route added at /results for final results view

---

### GS-007: Unified Game Pause/Resume

**Status:** `complete`
**Depends On:** GS-001, T-001

**Story:** As a player, I need to pause the entire game so that all timers stop for safety or comfort breaks.

**Acceptance Criteria:**

- [x] "Pause Game" action available during active gameplay
- [x] Pausing stops ALL timers (hiding period, hiding duration, response timer)
- [x] Visual indicator shows game is paused
- [x] "Resume Game" action restarts all timers from where they stopped
- [x] Pause state persists if app is closed
- [x] Both hider and seeker views show pause status

**Size:** S

**Rules Reference:**

- See RESEARCH_NOTES.md "Pausing" section
- Game can be paused if needed for safety/comfort
- When paused, ALL timers stop

**Tests Written (40 tests):**

```typescript
describe('gameStore pause/resume', () => {
  describe('isGamePaused state', () => {
    it('should initialize with isGamePaused as false')
  })
  describe('canPauseGame getter', () => {
    it('should return false during setup phase')
    it('should return true during hiding-period phase')
    it('should return true during seeking phase')
    it('should return true during end-game phase')
    it('should return false during round-complete phase')
  })
  describe('pauseGame action', () => {
    it('should set isGamePaused to true')
    it('should fail if game is already paused')
    it('should fail if not in a pauseable phase')
    it('should record pause timestamp')
  })
  describe('resumeGame action', () => {
    it('should set isGamePaused to false')
    it('should fail if game is not paused')
    it('should clear pause timestamp on resume')
  })
  describe('pause state persistence', () => {
    it('should persist pause state to localStorage')
    it('should rehydrate pause state from localStorage')
  })
  describe('pause clears on phase transitions', () => {
    it('should clear pause state when transitioning to round-complete')
    it('should clear pause state when game is reset')
  })
})
describe('GamePauseOverlay', () => {
  describe('visibility', () => {
    it('should not render when game is not paused')
    it('should render when game is paused')
    it('should not render during setup phase')
  })
  describe('pause button', () => {
    it('should display pause button during active gameplay')
    it('should not display pause button during setup phase')
    it('should pause game when pause button is clicked')
    // ... additional button tests for all phases
  })
  describe('overlay content', () => {
    it('should display Game Paused title when paused')
    it('should display pause indicator message')
    it('should display resume button when paused')
  })
  describe('resume functionality', () => {
    it('should resume game when resume button is clicked')
    it('should hide overlay after resume')
  })
  describe('accessibility', () => {
    it('should have proper ARIA label for overlay')
    it('should have proper heading structure')
    it('should trap focus within overlay when paused')
  })
})
```

**Implementation Notes:**

- GamePauseOverlay component with Teleport for fullscreen overlay
- Pause button shown in header during active gameplay phases
- All three timer components watch gameStore.isGamePaused and pause/resume accordingly
- Pause state persisted to localStorage alongside game state
- Automatically clears pause when transitioning to round-complete phase

---

## Epic 6: Mobile UX Polish

User experience improvements.

---

### UX-001: Responsive Layout

**Status:** `complete`
**Depends On:** FOUND-001, FOUND-004

**Story:** As a player, I need the app to work well on my phone so that I can use it during gameplay.

**Acceptance Criteria:**

- [x] All views work on screens 320px and up
- [x] Touch targets minimum 44x44px
- [x] No horizontal scrolling on main views
- [x] Text readable without zooming
- [x] Tested on iOS Safari and Android Chrome

**Size:** M

**Tests Written (23 E2E tests in responsive.spec.ts):**

```typescript
describe('Responsive Layout - 320px width', () => {
  describe('Home Page', () => {
    test('should display without horizontal scrolling')
    test('should have readable text without zooming')
    test('should have touch-friendly New Game button (min 44px height)')
  })
  describe('Game Setup Page', () => {
    test('should display without horizontal scrolling')
    test('should have touch-friendly Add Player button (min 44px height)')
    test('should have touch-friendly game size buttons (min 44px height)')
    test('should have touch-friendly Start Game button (min 44px height)')
    test('should display player management form correctly')
  })
})
describe('Responsive Layout - Mobile Chrome (Pixel 5)', () => {
  test('should center content vertically and horizontally')
  test('should allow adding players and show them in list')
  test('should show hider selection after adding 2+ players')
})
describe('Touch Targets', () => {
  test('Home page New Game button should be at least 44x44')
  test('Setup page Add Player button should be at least 44px height')
  test('Setup page Start Game button should be at least 44px height')
})
describe('No Horizontal Scroll', () => {
  test('Home page should not have horizontal scroll')
  test('Setup page should not have horizontal scroll')
})
describe('Text Readability', () => {
  test('body text should use minimum 14px font size')
  test('headings should be large enough to be clearly visible')
})
```

**Implementation Notes:**

- E2E tests run on both Chromium desktop and Pixel 5 mobile viewport (46 total test runs)
- All buttons updated to have `min-h-11` (44px minimum height) for touch targets
- Game size buttons, hider selection buttons, confirmation modal buttons fixed
- AskQuestionModal buttons made responsive with flex-col on mobile, flex-row on larger screens
- Remove player buttons increased from 32px to 44px height

---

### UX-002: Navigation Structure

**Status:** `complete`
**Depends On:** GS-003

**Story:** As a player, I need intuitive navigation so that I can quickly access different features.

**Acceptance Criteria:**

- [x] Bottom tab navigation for main sections
- [x] Tabs: Questions, Timers, Cards (hider), History
- [x] Current tab clearly indicated
- [x] Smooth transitions between views

**Size:** M

**Tests Written (24 tests):**

- BottomNav component tests (18 tests):
  - Tab display: displays all tabs, labels, and touch-friendly buttons
  - Current tab indication: highlights active tab correctly
  - Tab switching: emits tab-change events
  - Mobile-friendly layout: fixed bottom bar, full width, flex layout
  - Accessibility: nav role, aria-label, aria-current
  - Visual icons: displays icons for each tab
- GamePlayView integration tests (6 tests):
  - Bottom navigation display and tabs
  - Tab switching with content updates
  - Smooth transitions

---

### UX-003: Notifications and Alerts

**Status:** `complete`
**Depends On:** T-002, CARD-006b

**Story:** As a player, I need timely notifications so that I don't miss important game events.

**Acceptance Criteria:**

- [x] In-app toast notifications for actions
- [x] Sound alerts for timer events (optional, toggleable)
- [x] Vibration feedback on mobile (optional)
- [x] Curse cleared notification

**Size:** M

**Tests Written (53 tests):**

```typescript
describe('useNotifications', () => {
  describe('toast notifications', () => {
    describe('showToast', () => {
      it('should add a toast notification to the list')
      it('should assign a unique ID to each toast')
      it('should set the correct type on toast')
      it('should auto-dismiss toast after default duration (3000ms)')
      it('should auto-dismiss toast after custom duration')
      it('should not auto-dismiss if duration is 0')
    })
    describe('dismissToast', () => {
      it('should remove a toast by ID')
      it('should do nothing if toast ID does not exist')
    })
    describe('clearAllToasts', () => {
      it('should remove all toasts')
    })
  })
  describe('sound alerts', () => {
    describe('soundEnabled setting', () => {
      it('should default to enabled')
      it('should allow toggling sound on/off')
      it('should allow setting sound directly')
    })
    describe('playSound', () => {
      it('should play sound when enabled')
      it('should not play sound when disabled')
      it('should support different sound types')
    })
  })
  describe('vibration feedback', () => {
    describe('vibrationEnabled setting', () => {
      it('should default to enabled')
      it('should allow toggling vibration on/off')
      it('should allow setting vibration directly')
    })
    describe('vibrate', () => {
      it('should call navigator.vibrate when enabled')
      it('should not call navigator.vibrate when disabled')
      it('should support short vibration pattern')
      it('should support long vibration pattern')
      it('should support double vibration pattern')
    })
    describe('browser support', () => {
      it('should handle browsers without vibration API gracefully')
    })
  })
  describe('combined notifications', () => {
    describe('notify', () => {
      it('should show toast, play sound, and vibrate by default')
      it('should respect options to disable sound and vibration')
      it('should use specified sound and vibration patterns')
    })
    describe('preset notifications', () => {
      it('should have preset for timer warning')
      it('should have preset for timer expired')
      it('should have preset for curse cleared')
      it('should have preset for hiding period ended')
      it('should have preset for game paused')
      it('should have preset for game resumed')
    })
  })
  describe('settings persistence', () => {
    it('should persist sound setting to localStorage')
    it('should persist vibration setting to localStorage')
  })
})
describe('ToastContainer', () => {
  describe('visibility', () => {
    it('should not render when there are no toasts')
    it('should render toasts when they exist')
  })
  describe('toast display', () => {
    it('should display toast message')
    it('should display multiple toasts')
  })
  describe('toast types', () => {
    it('should apply info styling for info toasts')
    it('should apply success styling for success toasts')
    it('should apply warning styling for warning toasts')
    it('should apply error styling for error toasts')
  })
  describe('dismiss functionality', () => {
    it('should have a dismiss button on each toast')
    it('should dismiss toast when dismiss button is clicked')
    it('should auto-dismiss after duration')
  })
  describe('positioning', () => {
    it('should be positioned at the top of the screen')
    it('should be centered horizontally')
  })
  describe('mobile-friendly design', () => {
    it('should have touch-friendly dismiss button (min 44px)')
    it('should have readable text size')
  })
  describe('accessibility', () => {
    it('should have role="alert" for screen readers')
    it('should have aria-live="polite" on container')
    it('should have aria-label on dismiss button')
  })
})
```

**Implementation Notes:**

- Created `src/composables/useNotifications.ts` with toast, sound, and vibration APIs
- Created `src/components/ToastContainer.vue` with Teleport to body for overlay
- Toast notifications appear at top-center with auto-dismiss after 3 seconds (configurable)
- Sound alerts use Web Audio API to generate tones for different event types
- Vibration uses `navigator.vibrate()` with short/long/double patterns
- Sound and vibration settings persist to localStorage and can be toggled
- Integrated into HidingPeriodTimer (warning at 5 min, complete notifications)
- Integrated into QuestionResponseTimer (warning at 1 min, expired notifications)
- Integrated into GamePauseOverlay (pause/resume notifications)
- Integrated into SeekerView for curse cleared notifications

---

### UX-004: Visual Design System

**Status:** `complete`
**Depends On:** FOUND-001

**Story:** As a player, I need a consistent visual theme with distinct category colors so that the app is easy to navigate and visually appealing.

**Acceptance Criteria:**

- [x] Tailwind theme extended with custom color palette
- [x] Primary accent color defined (inspired by Jet Lag branding)
- [x] Each question category has a distinct, accessible color
- [x] Dark/navy background theme for game feel
- [x] All colors meet WCAG 2.1 AA contrast requirements
- [x] Category colors work in bright outdoor sunlight
- [x] Design tokens documented in Tailwind config

**Size:** S

**Design Notes:**

- See RESEARCH_NOTES.md "Visual Design Research" section
- See RESEARCH_NOTES.md "Question Category Colors (From Nebula Show)" for exact hex values
- See RESEARCH_NOTES.md "Question Icon Reference" for icon descriptions per category
- Official Jet Lag logo palette: #1a1a2e (navy), #c73e3e (red), #f07d2e (orange), #f5b830 (gold), #00aaff (cyan)
- Prioritize accessibility and outdoor visibility

**Tests Written (10 tests):**

```typescript
describe('Design System Colors', () => {
  describe('BRAND_COLORS', () => {
    it('should define all Jet Lag brand colors')
    it('should use correct hex values from official branding')
  })
  describe('CATEGORY_COLORS', () => {
    it('should define colors for all six question categories')
    it('should use correct hex values from Nebula show UI (adjusted for contrast)')
  })
  describe('getCategoryColor', () => {
    it('should return correct color for each category')
  })
  describe('CARD_TYPE_COLORS', () => {
    it('should define colors for all card types')
    it('should use brand-consistent colors')
  })
  describe('getCardTypeColor', () => {
    it('should return correct color object for each card type')
  })
  describe('WCAG contrast requirements', () => {
    it('should have category colors with sufficient contrast against white text')
    it('should have brand colors with sufficient contrast')
  })
})
```

**Implementation Notes:**

- Created `src/design/colors.ts` with typed color constants and helper functions
- Tailwind v4 @theme configuration in `src/assets/main.css` with CSS custom properties
- QuestionList uses category-specific header colors with white text
- CardHand uses card type colors with inline styles for flexibility
- Thermometer (#d4a012 → #b38b0f) and Photo (#5ba4c9 → #3d8ab3) colors adjusted for WCAG 3:1 contrast
- Brand colors: navy, red, orange, gold, cyan from Jet Lag logo

---

### UX-005: Auto-focus Player Name Input After Adding Player

**Status:** `complete`
**Depends On:** None

**Story:** As a user setting up a game, after I add a player, the cursor should automatically return to the name input field so I can quickly add multiple players without clicking into the text box each time.

**Acceptance Criteria:**

- [x] After clicking "Add" button, focus returns to player name input
- [x] After pressing Enter to add a player, focus remains in player name input
- [x] Focus behavior works on both desktop and mobile
- [x] Screen reader announces focus change appropriately

**Size:** S

**Tests Written (4 tests):**

```typescript
// GameSetupView.spec.ts - additional tests for focus behavior
describe('player name input focus behavior (UX-005)', () => {
  it('should focus player name input after clicking Add button')
  it('should keep focus in player name input after pressing Enter to add')
  it('should have input focused and ready for next entry')
  it('should work correctly when adding multiple players in sequence')
})
```

**Implementation Notes:**

- Added `playerNameInputRef` template ref to player name input element in GameSetupView.vue
- Added `nextTick()` import and `await nextTick()` before focus call
- Called `playerNameInputRef.value?.focus()` at end of `addPlayer()` function
- Focus behavior works via the `@keyup.enter` handler which calls the same `addPlayer()` function

---

### UX-006: Icon-Based Question Menu Redesign

**Status:** `complete`
**Depends On:** UX-004, Q-003b, Q-006

**Story:** As a player, I need the question menu to look and feel like the official Jet Lag: Hide and Seek show UI, with category-colored tiles and per-question icons, so that questions are faster to recognize and the app feels polished.

**Acceptance Criteria:**

- [x] New `QuestionMenu` component renders questions as a grid of category-colored tiles (replaces the plain `QuestionList` in `SeekerView`)
- [x] Each question has an SVG icon (from `src/design/questionIcons.ts`) matching the show's "Question Icon Reference"; questions without a defined icon fall back to a short text label
- [x] Category headers show icon, name, and "DRAW X, PICK Y" cost using the Nebula category colors
- [x] Tile status states: available / asked (faded, strikethrough) / pending (pulsing)
- [x] Questions locked during hiding period (shows locked notice); Photo/Tentacle categories disabled during end-game
- [x] Tapping an available tile emits `questionSelect`; tapping an asked tile opens a detail overlay with Re-ask (2× cost) emitting `reaskSelect`
- [x] Bottom nav, timers, and history converted to inline SVG icons to match the new aesthetic
- [x] All existing tests pass; new `QuestionMenu.spec.ts` covers the component (19 tests)

**Size:** L

**Notes:**

- Continuation of UX-004 (which delivered colors only); this card adds the icon set and the tile-grid menu.
- `QuestionMenu.spec.ts` added retroactively to bring the component up to the project's TDD standard before committing.

**Tests Written (19 tests):**

```typescript
describe('QuestionMenu', () => {
  describe('menu display', () => {
    it('should render the question menu container')
    it('should display the QUESTION MENU header')
    it('should display all six categories')
    it('should display draw/pick values for each category')
    it('should render a tile for every question')
  })
  describe('question selection', () => {
    it('should emit questionSelect when an available question tile is clicked')
    it('should not emit questionSelect for an already-asked question tile')
    it('should not emit questionSelect while another question is pending')
  })
  describe('status indicators', () => {
    it('should mark asked questions with the asked tile class')
    it('should mark the pending question with the pending tile class')
  })
  describe('hiding period lock', () => {
    it('should show a locked notice during the hiding period')
    it('should not emit questionSelect during the hiding period')
    it('should not show the locked notice during seeking')
  })
  describe('end-game category disabling', () => {
    it('should disable Photo and Tentacle categories during end-game')
    it('should not emit questionSelect for a disabled category during end-game')
  })
  describe('question detail overlay', () => {
    it('should open the detail overlay when an asked question is tapped')
    it('should emit reaskSelect when Re-ask is clicked in the detail overlay')
    it('should close the detail overlay when Close is clicked')
  })
  describe('category stats', () => {
    it('should show available/total counts per category')
  })
})
```

---

## Epic 6: Developer Tools

Tools to help with local development and testing. Only visible/active when running in dev mode (`npm run dev`).

---

### DEV-001: Skip Hiding Period Button

**Status:** `complete`
**Depends On:** GS-001, GS-003

**Story:** As a developer testing the game, I need to skip the 30-minute hiding period so that I can quickly test the seeking and end-game phases.

**Acceptance Criteria:**

- [x] Button only appears when `import.meta.env.DEV` is true (dev mode)
- [x] Button only appears during the `hiding-period` phase
- [x] Button appears in both HiderView and SeekerView
- [x] Clicking the button calls `gameStore.startSeeking()` to transition to seeking phase
- [x] Button is visually distinct (e.g., yellow/warning style with "DEV" badge) to clearly indicate it's a dev tool
- [x] Button has accessible label indicating its purpose

**Size:** S

**Tests Written (12 tests):**

```typescript
describe('DevSkipHidingPeriod', () => {
  describe('visibility', () => {
    it('should not render in production mode')
    it('should render in dev mode during hiding period')
    it('should not render during setup phase')
    it('should not render during seeking phase')
    it('should not render during end-game phase')
    it('should not render during round-complete phase')
  })
  describe('functionality', () => {
    it('should call startSeeking when clicked')
    it('should transition game to seeking phase')
  })
  describe('visual styling', () => {
    it('should display DEV badge')
    it('should have visually distinct styling (warning/yellow appearance)')
  })
  describe('accessibility', () => {
    it('should have accessible label')
    it('should be keyboard accessible')
  })
})
```

**Implementation Notes:**

- DevSkipHidingPeriod component created as standalone component
- Button styled with yellow gradient background, dashed border, and red "DEV" badge
- Integrated into both HiderView and SeekerView after HidingPeriodTimer
- Uses `import.meta.env.DEV` for dev mode detection
- Uses gameStore.currentPhase for phase detection

---

## Epic 7: Question UX Improvements

Enhancements to the question browsing and asking experience.

---

### QUX-001: Lock Questions During Hiding Period

**Status:** `complete`
**Depends On:** Q-003b, GS-001

**Story:** As a seeker, I should not be able to ask questions during the hiding period, but I should still be able to browse them to plan my strategy.

**Acceptance Criteria:**

- [x] Questions are viewable during hiding period
- [x] "Ask" functionality is disabled during hiding period phase
- [x] Clicking a question shows a message explaining questions are locked until seeking begins
- [x] Questions become askable once game transitions to seeking phase
- [x] Visual indicator shows questions are temporarily locked (e.g., lock icon, muted styling)

**Size:** S

**Tests Written (6 tests in QuestionList.spec.ts):**

```typescript
describe('hiding period question locking (QUX-001)', () => {
  it('should allow viewing questions during hiding period')
  it('should disable ask functionality during hiding period phase')
  it('should show locked message when question clicked during hiding period')
  it('should enable asking when seeking phase begins')
  it('should show visual lock indicator during hiding period')
  it('should not emit event when clicking question during hiding period')
})
```

**Implementation Notes:**

- Added `isHidingPeriodPhase` computed property to detect hiding-period phase
- Updated `isQuestionSelectable()` to return false during hiding period
- Added visual lock banner at top of QuestionList with lock icon (🔒)
- Added "Locked until seeking begins" notice inside expanded categories
- Questions styled with reduced opacity and cursor-not-allowed during hiding period

---

### QUX-002: Collapse Question Categories by Default

**Status:** `complete`
**Depends On:** Q-003a

**Story:** As a player, I want question categories collapsed by default so that I can see all categories at a glance and expand only the ones I'm interested in.

**Acceptance Criteria:**

- [x] All question categories are collapsed by default on component mount
- [x] Category headers show expand/collapse chevron indicator
- [x] Tapping a category header expands/collapses that category
- [x] Expanded state is preserved during the session (not persisted across page reloads)
- [x] Category count badge visible when collapsed (e.g., "22 questions")

**Size:** S

**Tests Written (5 new tests in QuestionList.spec.ts):**

```typescript
describe('category collapsing', () => {
  it('should render all categories collapsed by default (QUX-002)')
  it('should show question count badge when collapsed (QUX-002)')
  it('should expand category when header is clicked (QUX-002)')
  it('should collapse category when expanded header is clicked (QUX-002)')
  it('should show expand/collapse chevron indicator (QUX-002)')
})
```

**Implementation Notes:**

- Changed `expandedCategories` initial state from all categories to empty Set
- Category headers already showed question count and chevron indicators
- Existing tests updated to expand categories before testing question interactions
- Added `expandCategory()` helper function for cleaner test code

---

## Epic 8: Physical Play & Standalone Mode

Support for playing with physical card decks and running hider/seeker modes independently on separate devices without backend synchronization.

---

### PHYS-001: Manual Card Entry for Hiders

**Status:** `complete`
**Depends On:** CARD-002

**Story:** As a hider using a physical card deck, I need to manually specify which cards are in my hand so that the app can track my time bonuses and available powerups.

**Acceptance Criteria:**

- [x] "Add Card" button available in HiderView
- [x] Modal/panel allows selecting card type (Time Bonus, Powerup, Curse, Time Trap)
- [x] For Time Bonus: select tier (1-5)
- [x] For Powerup: select from available powerup types
- [x] For Curse: select from available curse cards
- [x] For Time Trap: select Time Trap card
- [x] Added card appears in hand immediately
- [x] Hand limit is still enforced (cannot add beyond limit)
- [x] Cards added manually are tracked the same as drawn cards

**Size:** M

**Tests Written (49 new tests):**

```typescript
// cardStore.spec.ts - 19 tests for addCardToHand
describe('cardStore addCardToHand (PHYS-001)', () => {
  describe('adding time bonus cards', () => {
    it('should add a time bonus card to hand')
    it('should add correct tier time bonus card')
    it('should add time bonus with correct bonus minutes for the tier')
    it('should return error for invalid tier')
    it('should return error when tier is not provided for time bonus')
  })
  describe('adding powerup cards', () => {
    it('should add a powerup card to hand')
    it('should add correct powerup type')
    it('should return error for invalid powerup type')
    it('should return error when powerup type is not provided')
  })
  describe('adding curse cards', () => {
    it('should add a curse card to hand')
    it('should add correct curse by ID')
    it('should return error for invalid curse ID')
    it('should return error when curse ID is not provided')
  })
  describe('adding time trap cards', () => {
    it('should add a time trap card to hand')
  })
  describe('hand limit enforcement', () => {
    it('should respect hand limit when adding cards')
    it('should work with expanded hand limit')
  })
  describe('instance ID assignment', () => {
    it('should assign unique instance ID to manually added cards')
  })
  describe('return value', () => {
    it('should return the added card on success')
  })
  describe('does not affect deck', () => {
    it('should not reduce deck size when adding cards manually')
  })
})

// AddCardModal.spec.ts - 30 tests for component
describe('AddCardModal', () => {
  describe('visibility')
  describe('header and instructions')
  describe('card type selection')
  describe('time bonus tier selection')
  describe('powerup type selection')
  describe('curse selection')
  describe('time trap selection')
  describe('confirm button')
  describe('cancel button')
  describe('hand full warning')
  describe('mobile-friendly design')
  describe('accessibility')
})
```

**Implementation Notes:**

- Added `addCardToHand(cardType, options)` action to cardStore that bypasses deck drawing
- Added `AddCardOptions` interface for type-safe options
- Created `AddCardModal.vue` component with full card type selection UI
- Added "+ Add Card" button to HiderView Cards section header
- Button is disabled when hand is full
- Modal shows warning when hand is full
- All card types supported: Time Bonus (with tier selection), Powerup, Curse, Time Trap

---

### PHYS-002: Manual Curse Activation for Seekers

**Status:** `complete`
**Depends On:** CARD-006a

**Story:** As a seeker in standalone mode, I need to manually activate curses that the hider announced in the real world so that the app can track my restrictions.

**Acceptance Criteria:**

- [x] "Hider Played Curse" button available in SeekerView
- [x] Modal shows list of all available curse cards
- [x] Each curse shows: name, effect, duration (if applicable)
- [x] Selecting a curse adds it to active curses for the seeker
- [x] Curse display shows the manually-added curse with its restrictions
- [x] Time-based curses start their countdown timer upon activation
- [x] Curses can be cleared when conditions are met (same as existing behavior)

**Size:** S

**Tests Written (46 tests):**

```typescript
// cardStore.spec.ts - 15 tests for activateCurseManually
describe('cardStore activateCurseManually (PHYS-002)', () => {
  describe('activating valid curse', () => {
    it('should add curse to active curses')
    it('should set correct curse properties from curse definition')
    it('should assign unique instance ID to activated curse')
    it('should set activatedAt timestamp')
    it('should set durationMinutes for time-based curses')
    it('should set penaltyMinutes for penalty curses')
    it('should mark until-found curses appropriately')
    it('should return the activated curse')
  })
  describe('error handling', () => {
    it('should return error for invalid curse ID')
    it('should return error for empty curse ID')
  })
  describe('multiple curse activation', () => {
    it('should allow activating multiple different curses')
    it('should allow activating the same curse multiple times')
  })
  describe('does not affect hand or deck', () => {
    it('should not modify hand when activating curse')
    it('should not modify deck size when activating curse')
    it('should not add to discard pile when activating curse')
  })
})

// CurseActivationModal.spec.ts - 24 tests for component
describe('CurseActivationModal', () => {
  describe('visibility')
  describe('header and instructions')
  describe('curse list display')
  describe('curse selection')
  describe('confirm button')
  describe('cancel button')
  describe('curse effect display')
  describe('mobile-friendly design')
  describe('accessibility')
})

// SeekerView.spec.ts - 7 tests for integration
describe('SeekerView curse activation UI (PHYS-002)', () => {
  describe('curse trigger button', () => {
    it('should show "Hider Played Curse" button in seeker view')
    it('should open curse selection modal when button clicked')
  })
  describe('curse activation', () => {
    it('should add selected curse to active curses when confirmed')
    it('should start countdown for time-based curses')
    it('should show curse restrictions in curse display')
    it('should close modal after confirmation')
    it('should close modal when cancel is clicked')
  })
})
```

**Implementation Notes:**

- Added `activateCurseManually(curseId)` action to cardStore that creates ActiveCurse without needing card in hand
- Created `CurseActivationModal.vue` component with full curse card selection UI
- Added "Hider Played Curse" button to SeekerView with lightning bolt icon
- Modal shows all 23 curses with name, description, effect, and duration badges
- Selected curse is immediately added to activeCurses and shown in existing CurseDisplay
- Time-based curses automatically start countdown using existing CurseDisplay timer logic

---

### PHYS-003: Standalone Mode Documentation

**Status:** `complete`
**Depends On:** PHYS-001, PHYS-002

**Story:** As a player, I need to understand how to use the app in standalone mode (without multiplayer sync) so that hiders and seekers can use separate devices independently.

**Acceptance Criteria:**

- [x] Document explains standalone mode concept
- [x] Instructions for hider device setup
- [x] Instructions for seeker device setup
- [x] Explains what needs to be communicated verbally between players
- [x] Covers: game start, questions, curses, time traps, game end
- [x] Accessible from in-app help/guide

**Size:** S

**Tests Written (13 tests):**

- HiderGuide.spec.ts (6 tests for standalone mode section):
  - should have standalone mode section
  - should explain standalone mode concept
  - should explain hider device setup
  - should explain what needs to be communicated verbally
  - should explain curse announcement to seekers
  - should explain time trap announcement

- SeekerGuide.spec.ts (7 tests for standalone mode section):
  - should have standalone mode section
  - should explain standalone mode concept
  - should explain seeker device setup
  - should explain what hider communicates to seekers
  - should explain how to receive curse announcements
  - should explain how to handle time trap announcements
  - should explain question and answer flow

**Implementation Notes:**

- Added "Standalone Mode" section to HiderGuide.vue (9th section)
- Added "Standalone Mode" section to SeekerGuide.vue (8th section)
- Hider guide covers: manual card entry, curse announcements, time trap announcements, question answers, game end
- Seeker guide covers: "Hider Played Curse" button, time trap handling, question/answer flow, communication tips
- Both guides accessible from existing help buttons in HiderView and SeekerView

---

## Epic 9: User Guides

In-app documentation to help players understand how to use the app.

---

### GUIDE-001: Hider Mode User Guide

**Status:** `complete`
**Depends On:** PHYS-001, DEV-001

**Story:** As a hider, I need an in-app guide explaining how to use all the hider features so that I can play effectively.

**Acceptance Criteria:**

- [x] Guide accessible from HiderView (help icon or menu item)
- [x] Covers: hiding period timer and what to do
- [x] Covers: card hand - viewing, understanding card types
- [x] Covers: playing powerup cards (each type explained)
- [x] Covers: playing curse cards and their effects
- [x] Covers: time bonuses and how they work
- [x] Covers: time traps and how to set them
- [x] Covers: answering questions and veto/randomize options
- [x] Covers: using the Move powerup
- [x] Mobile-friendly layout (scrollable, readable)

**Size:** M

**Tests Written (32 tests in HiderGuide.spec.ts):**

- Visibility tests (3): modal renders/hides based on isOpen prop
- Header tests (2): displays title and close button
- Content sections tests (8): all 8 guide sections present with correct titles
- Section content details tests (8): each section contains expected content
- Interactions tests (3): close button, overlay click, content click handling
- Collapsible sections tests (2): expand/collapse functionality
- Mobile-friendly layout tests (1): scrollable content area
- Accessibility tests (2): aria-modal and aria-labelledby attributes

**Integration tests (3 tests in RoleBasedViews.spec.ts):**

- Help button displays in HiderView
- Clicking help button opens guide modal
- Clicking close button closes guide modal

**Implementation Notes:**

- Implemented as a modal component (HiderGuide.vue)
- Collapsible accordion-style sections for easy navigation
- 8 content sections covering all hider features
- Help icon button added to HiderView header row
- Mobile-friendly with scrollable content and touch-friendly targets

---

### GUIDE-002: Seeker Mode User Guide

**Status:** `complete`
**Depends On:** PHYS-002, QUX-001

**Story:** As a seeker, I need an in-app guide explaining how to use all the seeker features so that I can play effectively.

**Acceptance Criteria:**

- [x] Guide accessible from SeekerView (help icon or menu item)
- [x] Covers: hiding period and what seekers do during it
- [x] Covers: browsing and asking questions
- [x] Covers: question categories and draw/keep rules
- [x] Covers: recording answers
- [x] Covers: active curses and their restrictions
- [x] Covers: time traps and what happens when triggered
- [x] Covers: end-game phase and finding the hider
- [x] Mobile-friendly layout (scrollable, readable)

**Size:** M

**Tests Written (30 tests):**

- SeekerGuide.spec.ts (27 tests):
  - Visibility tests (3): modal renders/hides based on isOpen prop
  - Header tests (2): displays title and close button
  - Content sections tests (7): all 7 guide sections present with correct titles
  - Section content details tests (7): each section contains expected content
  - Interactions tests (3): close button, overlay click, content click handling
  - Collapsible sections tests (2): expand/collapse functionality
  - Mobile-friendly layout tests (1): scrollable content area
  - Accessibility tests (2): aria-modal and aria-labelledby attributes

- RoleBasedViews.spec.ts integration tests (3 tests):
  - Help button displays in SeekerView
  - Clicking help button opens guide modal
  - Clicking close button closes guide modal

**Implementation Notes:**

- Mirrors structure of hider guide for consistency
- SeekerGuide.vue component with 7 collapsible sections
- Help button added to SeekerView header row
- Blue theme (seeker color) for guide header styling
- Sections cover: hiding period, asking questions, question categories, recording answers, active curses, time traps, end-game phase

---

## Epic 10: Multiplayer Sync

Real-time synchronization of game state across multiple player devices, similar to Jackbox-style room joining.

---

### MULTI-001: Multiplayer Architecture Planning

**Status:** `complete`
**Depends On:** None

**Story:** As a developer, I need to design the multiplayer architecture before implementation so that we make good technical decisions.

**Acceptance Criteria:**

- [x] Document backend technology choice (Supabase Realtime, Firebase, custom WebSocket, etc.)
- [x] Define room/game creation flow
- [x] Define player join flow (room codes like Jackbox)
- [x] Define state synchronization strategy
- [x] Define conflict resolution approach
- [x] Define host vs participant permissions
- [x] Consider offline/reconnection handling
- [x] Estimate infrastructure costs

**Size:** M

**Notes:**

- This is a planning/design story, not implementation
- Output is a technical design document
- Should be reviewed before starting implementation stories

**Design Outcome (decisions locked):**

- **Backend:** self-hosted **Fastify + WebSocket** (data plane) + **REST** (control plane: create/join/rejoin/lobby), **Postgres** for room/session records. No third-party realtime vendor. Goal is **live sync only** (positions + shared game state); durable history/accounts deferred.
- **Hosting:** **Railway**, one project — `web` (static PWA), `api` (Node), Postgres plugin. WebSockets over standard HTTPS port; `api` runs **single-instance** for v1 because the `RoomHub` is in-memory (Redis fan-out is future scope). Cost realistically ~$5–20/mo.
- **Sessions (Jackbox-style):** host creates room → short **Crockford-style code** (no `0/O/1/I/L`, len 4, collision retry) → others join with code + name. Each device gets a **rejoin token** (32-byte random, only SHA-256 hash stored) so a dropped phone reclaims its spot. TTL: created at now+2 days, slid forward on activity (persist-while-paused), dropped to now+1h on round end.
- **Sync layer:** new client `SyncService` mirroring the existing `PersistenceService` pattern (`NoopSyncService` default, `WsSyncService` real); stores stay the local source of truth and the app is **offline-first** when no room is joined. Server-authoritative for sequencing/visibility, host-authoritative for game decisions.
- **Anti-cheat:** server owns each device's role and **withholds hider-only data (GPS, cards, pre-reveal zone) from seeker connections at the protocol layer**; the free role toggle is disabled in-room (see SYNC-003).
- **Sandbox:** all untrusted code execution (install/dev/test/runtime) runs in Docker via `docker-compose`; host home/SSH never mounted; `.npmrc ignore-scripts` + lockfiles as defense-in-depth (see INFRA-001/002).
- Full design doc: `~/.claude/plans/cached-coalescing-squid.md`.

---

### MULTI-002: Room Creation & Join Flow

**Status:** `complete`
**Depends On:** MULTI-001

**Story:** As a player, I need to create a game room and share a code so that other players can join from their devices.

**Acceptance Criteria:**

- [x] Host can create a new game room (`POST /rooms` → returns code + host rejoin token)
- [x] Room generates a short, memorable **Crockford-style** code (len 4, alphabet excludes `0/O/1/I/L`, collision retry, recyclable across ended rooms)
- [x] Room code is displayed prominently for sharing
- [x] Other players can enter room code + name to join (`POST /rooms/:code/join` → returns player id + rejoin token)
- [x] Joined players appear in a lobby/waiting area
- [x] Host can see all joined players
- [x] Host can start the game when ready
- [x] Players can leave and **rejoin** with their rejoin token after a drop (`POST /rooms/:code/rejoin`)
- [x] Session persists a few days while paused/ongoing (TTL slides on activity) and expires shortly after the round ends
- [x] Invalid/expired room codes and room-full scenarios are handled gracefully

**Size:** L

**Implementation Notes:**

- `src/services/sync/roomApi.ts`: typed `RoomApi` client for the INFRA-005 endpoints (create/get/join/rejoin) with `RoomApiError` (status + `notFound`); base URL from `VITE_API_URL`.
- `src/stores/roomStore.ts`: Pinia store holding code/roster/self/rejoin token; persists `{code, rejoinToken, selfId}` via the existing persistence service so a refresh/drop can rejoin; `inRoom`/`isHost` getters; injectable `api` for tests. (Codes/TTL/recycling are enforced server-side by INFRA-004/005.)
- `src/views/LobbyView.vue` + `/lobby` route + a "MULTIPLAYER" entry on HomeView: host/join forms, prominent code display, roster, host-only Start, leave, graceful error banner.
- TDD: `roomApi.spec.ts` (8), `roomStore.spec.ts` (7), `LobbyView.spec.ts` (7). Verified in-container: 1297 frontend tests pass; production build succeeds.
- Note: "Start Game" navigates to the game view for now; phase/start broadcast wiring lands in SYNC-002 / MULTI-003b.

**Depends On:** MULTI-001, INFRA-003, INFRA-004, INFRA-005

**Tests to Write:**

```typescript
describe('room creation and join', () => {
  it('should create room with unique code')
  it('should allow players to join with code')
  it('should show joined players in lobby')
  it('should allow host to start game')
  it('should handle invalid room codes')
  it('should handle room full scenarios')
})
```

---

### MULTI-003a: Real-Time Position Sync

**Status:** `complete`
**Depends On:** MULTI-002, INFRA-006, SYNC-002

**Story:** As a player, I need everyone's live GPS position to sync across devices so that the hider can track seekers and seekers can see each other on the shared map.

**Acceptance Criteria:**

- [x] Client sends throttled position updates (≤ every 2–3 s OR moved > ~15 m; low-accuracy fixes dropped)
- [x] Server coalesces latest-per-player and broadcasts batched `pos.batch` on a 1–2 s tick
- [x] Positions live in-memory only (never persisted)
- [x] **Hider position is withheld from seekers server-side** — seekers only receive the declared zone (see SYNC-003)
- [x] Server computes `zone.breach` when a seeker enters the hiding zone (drives MAP-006)

**Size:** L

**Notes:**

- This is the user's primary motivation for the backend (live position tracking)

**Implementation Notes:**

- Client send-path (this story): `src/composables/positionThrottle.ts` — pure `shouldSendPosition(last, next)` (send if ≥2.5s elapsed OR moved >15m; drop fixes with accuracy >100m) + `distanceMeters`. `src/composables/useGeolocation.ts` — `createGeolocationTracker({ geolocation, send })` watches `navigator.geolocation`, applies the throttle, exposes `ownPosition`/`error`; `useGeolocation()` binds `send` to `useSync().sendPosition`.
- Server-side ACs (coalescing latest-per-player, batched `pos.batch` tick, in-memory-only, hider-withholding, `zone.breach`) were implemented + tested in **INFRA-006** (`roomHub.ts`/`gateway.ts`; `gateway.test.ts` asserts withholding and breach over real sockets).
- TDD: `positionThrottle.spec.ts` (9) + `useGeolocation.spec.ts` (7, mock geolocation). Verified in-container: 1326 frontend tests pass.
- Rendering the position markers on the map is MAP-003 (depends on MAP-002 geo data); this story delivers the sync plumbing.

---

### MULTI-003b: Real-Time Game-State Sync (umbrella)

**Status:** `pending` (tracked via sub-stories below)
**Depends On:** MULTI-003a

**Story:** As a player in a multiplayer game, I need game-state changes to sync across all devices in real-time so that everyone sees the same game state.

**Acceptance Criteria (delivered across the sub-stories):**

- [ ] Game phase changes sync to all players — **MULTI-003b-1**
- [ ] Question asked/answered events sync immediately — **MULTI-003b-2**
- [ ] Curse activations appear on all seeker devices — **MULTI-003b-2**
- [ ] Timer states are synchronized (ping/pong clock offset) — **MULTI-003b-3**
- [ ] Card draws recorded/synced (cards withheld from seekers) — **MULTI-003b-3**
- [ ] Time trap triggers sync to all players — **MULTI-003b-3**
- [ ] Conflict resolution handles simultaneous actions — host-authoritative, **MULTI-003b-1**
- [ ] Optimistic UI updates with server reconciliation — **MULTI-003b-1**

**Size:** XL → split into 003b-1/2/3.

**Notes:**

- The XL card was split per CLAUDE.md ("split cards if too large"). Foundation
  first (phase), then questions/curses, then timers/cards/traps.

---

### MULTI-003b-1: Phase Sync (host-authoritative)

**Status:** `complete`
**Depends On:** MULTI-003a

**Story:** As a player, I need game phase changes to sync so that everyone moves through hiding/seeking/end-game together.

**Acceptance Criteria:**

- [x] Host phase actions broadcast to all devices (`host.action` → server applies → `phase` broadcast)
- [x] Non-host clients apply the synced phase via `useSync` (no local-only phase drift in a room)
- [x] Host-authoritative: only the host's phase actions take effect (conflict resolution)
- [x] Optimistic local update on the host with server confirmation
- [x] Offline play unaffected (phase still driven locally with no room)

**Size:** M

**Implementation Notes:**

- Server: `RoomHub` gains `phase` + `applyHostAction(actorId, action)` (host-only, maps start-hiding/start-seeking/end-round → phase; non-host/unknown ignored). Gateway `host.action` → `applyHostAction` → broadcast `phase`; `welcome` now uses `hub.getPhase()`.
- Client: `useSync` adds `sendHostAction`. `src/composables/useGameSync.ts` watches `sync.phase` and mirrors it into `gameStore.currentPhase` **only while in a room**; `hostAction()` does an optimistic local update + broadcast for the host (no-op for non-host). LobbyView "Start Game" now broadcasts `start-hiding`.
- TDD: roomHub phase (5) + gateway phase (2 over real sockets) + `useGameSync.spec.ts` (4). Verified in-container: server 65 tests, frontend 1330 tests pass; frontend + backend prod builds succeed.

---

### MULTI-003b-2: Question & Curse Sync

**Status:** `complete`
**Depends On:** MULTI-003b-1

**Story:** As a player, I need asked/answered questions and curse activations to appear on every device.

**Acceptance Criteria:**

- [x] Question asked/answered events sync immediately to all players
- [x] Curse activations appear on all seeker devices
- [x] Reuses `questionStore`/`cardStore` shapes (no parallel state)

**Size:** L

**Implementation Notes:**

- Shared protocol: added `game.event` client message + `GameEventRelay` server message (`{kind, from, payload}`) with kinds `question.asked/answered/vetoed`, `curse.activated/cleared`; type-guards updated.
- Server: gateway `game.event` handler relays to everyone **except the sender**, tagged with `from` (test verifies no self-echo).
- Client: `useSync` gains `sendGameEvent`/`onGameEvent`. `src/composables/useQuestionCurseSync.ts` wraps `askQuestion/answerQuestion/vetoQuestion/activateCurse` to emit when in a room, and applies inbound events to the existing `questionStore`/`cardStore` with an `applyingRemote` echo guard (no parallel state).
- TDD: `useQuestionCurseSync.spec.ts` (5) + gateway relay test (1). Verified in-container: server 66, frontend 1335 pass; both prod builds OK.

---

### MULTI-003b-3: Timer, Card & Time-Trap Sync

**Status:** `complete`
**Depends On:** MULTI-003b-2

**Story:** As a player, I need timers, card draws, and time traps synchronized so scoring and tension stay consistent.

**Acceptance Criteria:**

- [x] Timer states synchronized using a ping/pong clock offset
- [x] Card draws recorded/synced; cards withheld from seekers (server-side)
- [x] Time trap triggers sync to all players

**Size:** L

**Implementation Notes:**

- Clock offset: shared `time.sync`/`time.reply` messages + pure `computeClockOffset(t1,t2,t3)` (NTP-style midpoint). Gateway replies to `time.sync` with server `Date.now()`; `useSync.syncClock()` sends a probe and `clockOffset` ref updates on reply — timers can reference a shared timeline.
- Cards withheld from seekers: a `card.drawn` event kind exists, but the apply-side is a deliberate no-op (the hider's hand is private; the server already withholds hider-only data), so card draws never leak to seekers.
- Time traps: `useQuestionCurseSync.triggerTimeTrap()` emits `timetrap.triggered` and the apply-side calls `cardStore.triggerTimeTrap`, reusing the MULTI-003b-2 relay.
- TDD: shared `computeClockOffset` (3) + gateway `time.sync` reply (1) + `useSync` clockOffset/game-event (2) + bridge time-trap/card-withhold (2). Verified in-container: server 67, frontend 1342 pass; both prod builds OK.

---

> **MULTI-003b umbrella complete** — all of 003b-1/2/3 are done.

---

### MULTI-004: Offline Handling & Reconnection

**Status:** `complete`
**Depends On:** MULTI-003b-3

**Story:** As a player, I need the app to handle disconnections gracefully so that I can rejoin the game without losing progress.

**Acceptance Criteria:**

- [x] App detects when connection is lost
- [x] Offline indicator shown to user
- [x] Local state preserved during disconnection
- [x] Automatic reconnection attempts
- [x] State reconciliation on reconnect
- [x] Other players notified of disconnected player
- [x] Configurable timeout before player is considered "dropped"

**Size:** M

**Implementation Notes:**

- Client: `WsSyncService` gains a `'reconnecting'` status + auto-reconnect with capped backoff (`RECONNECT_DELAYS_MS`, configurable); an unexpected `onclose` schedules a retry that re-opens and re-sends the `hello` handshake, so the server's fresh `welcome` reconciles state. Manual `disconnect()` sets `manualClose` and never reconnects. Local state is untouched (stores/localStorage persist independently).
- Server gateway: on socket close it now marks the player disconnected and broadcasts `player.presence{connected:false}` (not `player.left`), keeping the slot for a configurable `dropTimeoutMs` grace period; full `player.left` only fires if they never reconnect. On reconnect, the pending drop timer is cancelled and a returning player triggers `player.presence{connected:true}` (vs `player.joined` for new).
- Offline indicator: LobbyView shows a `connection-indicator` banner (reconnecting/offline) when in a room and not connected.
- TDD: `syncService.spec.ts` reconnection (4) + gateway presence-on-drop (1) + LobbyView indicator (1). Verified in-container: server 68, frontend 1347 pass; both prod builds OK.

> **Epic 10 (Multiplayer Sync) complete** — MULTI-001…004 all done.

**Size:** M

---

## Epic 11: Branding & Visual Identity

Logo and branding assets to give the app a polished, recognizable identity.

---

### BRAND-001: Create Jet Lag Stillwater Edition Logo Component

**Status:** `complete`
**Depends On:** None

**Story:** As a player, I want to see a distinctive logo that combines Jet Lag branding with Oklahoma State University identity, so the app feels like an authentic Stillwater adaptation.

**Acceptance Criteria:**

- [x] SVG logo component created at `src/components/JetLagLogo.vue`
- [x] Logo mimics Jet Lag style: rounded rectangle badge with gradient stripes
- [x] Instead of airplane, features OSU "pistols firing" hand gesture silhouette
- [x] Text layout: "JET" + [pistol icon] + "LAG" in display font
- [x] Subtitle "STILLWATER EDITION" in gold/orange badge below
- [x] Component accepts `size` prop (sm, md, lg) for responsive use
- [x] Logo colors use existing brand palette from design system
- [x] Component is accessible (proper ARIA labels, respects reduced-motion)

**Size:** S

**Tests Written (9 tests):**

```typescript
// JetLagLogo.spec.ts
describe('JetLagLogo component (BRAND-001)', () => {
  describe('rendering', () => {
    it('should render SVG logo element')
    it('should display "JET" and "LAG" text elements')
    it('should display "STILLWATER EDITION" subtitle')
    it('should include pistol firing hand gesture graphic')
  })
  describe('size prop', () => {
    it('should render medium size by default')
    it('should render small size when size="sm"')
    it('should render large size when size="lg"')
  })
  describe('accessibility', () => {
    it('should have appropriate aria-label for screen readers')
    it('should have role="img" for screen readers')
  })
})
```

**Implementation Notes:**

- SVG logo uses viewBox="0 0 200 100" with proportional scaling via size prop
- Size variants: sm=120w, md=200w (default), lg=280w
- Navy badge background (#1a1a2e) with gradient stripes (red → orange → gold)
- Pistol firing hand gesture rendered as simple path between JET and LAG text
- Gold gradient badge below main text for "STILLWATER EDITION"
- Uses BRAND_COLORS from design system for consistent theming

---

### BRAND-002: Display Logo on Game and Setup Pages

**Status:** `complete`
**Depends On:** BRAND-001

**Story:** As a player, I see the Jet Lag Stillwater Edition logo prominently on the game and setup screens, reinforcing the game's identity.

**Acceptance Criteria:**

- [x] Logo displayed on `/setup` page (GameSetupView.vue) in header area
- [x] Logo displayed on `/game` page (GamePlayView.vue) in appropriate location
- [x] Logo is responsive and scales appropriately on mobile (320px+)
- [x] Logo placement follows mobile-first design principles
- [x] Logo does not obstruct game controls or important information
- [x] Logo uses appropriate size variant for each context

**Size:** S

**Tests Written (6 tests):**

```typescript
// GameSetupView.spec.ts - additional tests
describe('logo display (BRAND-002)', () => {
  it('should render JetLagLogo component')
  it('should position logo in header area')
  it('should use appropriate size for mobile viewport')
})

// RoleBasedViews.spec.ts - additional tests for GamePlayView
describe('logo display (BRAND-002)', () => {
  it('should render JetLagLogo component')
  it('should position logo without obstructing controls')
  it('should use appropriate size for context')
})
```

**Implementation Notes:**

- Imported JetLagLogo component in GameSetupView.vue and GamePlayView.vue
- Logo placed in header area above page title on setup page
- Logo placed above phase badge on gameplay page
- Uses size="sm" (120px width) for mobile-first design
- Logo container uses flex centering with margin-bottom for spacing

---

## Epic 12: Bug Fixes

Bug fixes discovered during playtesting or development.

---

### BUG-001: Fix Incorrect "Hand Limit Reached" Warning in Card Draw Modal

**Status:** `complete`
**Depends On:** None

**Story:** As a hider drawing cards after answering a question, I should only see a "hand limit reached" warning if keeping the drawn cards would actually exceed my hand limit, not when my hand still has room.

**Bug Description:**

When cards are drawn via `discardAndDraw` or powerup effects, they are immediately added to the hand before the CardDrawModal displays. This causes `availableSlots` to show 0 (or low), triggering a false "Hand limit reached!" warning even when the player's hand has room for the cards they're selecting.

**Root Cause:**

In `cardStore.ts`, `discardAndDraw()` and `playDrawExpandPowerup()` add cards to `hand.value` immediately:

```typescript
drawnCards.push(card)
hand.value.push(card) // <-- Cards already in hand
```

Then in `CardDrawModal.vue`:

```typescript
const availableSlots = computed(() => cardStore.availableSlots)
const handLimitExceeded = computed(() => props.keepCount > availableSlots.value)
```

Since drawn cards are already counted in the hand, `availableSlots` doesn't reflect the true available space.

**Acceptance Criteria:**

- [x] Card draw modal does NOT show "Hand limit reached" warning when hand has room
- [x] Warning only appears when keeping cards would genuinely exceed hand limit
- [x] Fix handles both `discardAndDraw` and powerup draw scenarios
- [x] Existing card draw flow continues to work correctly
- [x] Unit tests verify correct warning behavior

**Size:** S

**Tests Written (4 tests):**

```typescript
// CardDrawModal.spec.ts - BUG-001 fix tests
describe('hand limit warning display (BUG-001)', () => {
  it('should NOT show warning when drawn cards are already in hand and there is room')
  it('should NOT show warning when hand has room after discarding unselected drawn cards')
  it('should show warning ONLY when keeping cards would truly exceed hand limit')
  it('should correctly calculate available space excluding already-drawn cards')
})
```

**Implementation Notes:**

- Implemented Option B: Calculate effective available slots as `availableSlots + drawnCards.length`
- The fix accounts for the fact that drawnCards are already counted in the hand
- Added `effectiveAvailableSlots` computed property to CardDrawModal.vue
- Updated `handLimitExceeded` to compare `keepCount > effectiveAvailableSlots`
- Updated existing tests to reflect correct behavior with realistic scenarios

---

## Epic 13: Backend & Infrastructure

Self-hosted Fastify + WebSocket + Postgres backend on Railway, developed/tested inside a Docker sandbox. Foundation for all multiplayer sync. See MULTI-001 design outcome and `~/.claude/plans/cached-coalescing-squid.md`.

---

### INFRA-001: Docker Sandbox for Dev & Test

**Status:** `complete`
**Depends On:** None

**Story:** As a developer, I need all untrusted dependency code to execute inside containers so that a malicious npm install/postinstall script cannot reach my host home directory or SSH keys.

**Acceptance Criteria:**

- [x] `docker-compose.yml` with services: frontend (Vite dev), backend (Fastify), postgres, one-shot test-runner
- [x] Source bind-mounted into containers; **host `$HOME` / `~/.ssh` never mounted**; no git credentials in containers; containers run as non-root
- [x] `node_modules` are container-managed named volumes; `npm install`/`npm ci` runs **inside** the container, never on the host
- [x] test-runner uses `network_mode: "none"` (kills postinstall exfil / second-stage)
- [x] Editing and `git commit` continue to happen on the host user session (unchanged workflow)
- [x] A benign sentinel test confirms an install script cannot read a file placed in host `$HOME`

**Size:** M

**Implementation Notes:**

- `Dockerfile.dev` (Node 22, non-root `node` user, tini) + `docker-compose.yml` services: `install`, `frontend`, `test`, `sentinel`, and stubbed `backend`/`postgres` (behind a `backend` profile until INFRA-003/004).
- `node_modules` and the npm cache live in named volumes (`frontend_node_modules`, `npm_cache`); the host `node_modules` is never written by the sandbox.
- `test` and `sentinel` run with `network_mode: "none"`.
- `scripts/sandbox-sentinel.sh` (in-container checks) + `scripts/run-sandbox-sentinel.sh` (host driver) prove host `$HOME`/`~/.ssh` are unreadable and no network is reachable.
- Verified: `docker compose run --rm test` → type-check + 1254 unit tests pass in-container; sentinel exits 0.
- Backend (Fastify) service is a documented placeholder; INFRA-003 fills it in.
- Docs: "Sandboxed Development & Testing (Docker)" section added to DEVELOPMENT.md.

---

### INFRA-002: npm Hardening (Defense-in-Depth)

**Status:** `complete`
**Depends On:** None

**Story:** As a developer, I need npm configured to block the most common supply-chain vector so that Docker isn't my only line of defense.

**Acceptance Criteria:**

- [x] `.npmrc` sets `ignore-scripts=true`, `save-exact=true`, `engine-strict=true`
- [x] Lockfiles committed; `npm ci` used everywhere (CI, Docker)
- [x] Native deps that need build scripts (e.g. existing `sharp`) are allowlisted via explicit `npm rebuild` in the Dockerfile
- [x] DEVELOPMENT.md documents the hardening and the rebuild allowlist

**Size:** S

**Implementation Notes:**

- `.npmrc` added with `ignore-scripts=true`, `save-exact=true`, `engine-strict=true`.
- `sharp` (used by `scripts/generate-pwa-icons.mjs`) allow-listed: the `install` compose service runs `npm rebuild sharp` after `npm ci`; CI gained a matching "Rebuild allow-listed native deps" step. Allowlist documented in `Dockerfile.dev`.
- Husky's `prepare` lifecycle script no longer auto-runs; documented `npm run prepare` one-time setup in DEVELOPMENT.md.
- Verified in-container: hardened `npm ci` + `npm rebuild sharp` succeeds, `sharp` loads (v0.34.5), type-check + 1254 tests pass.

---

### INFRA-003: Backend Skeleton

**Status:** `complete`
**Depends On:** INFRA-001, INFRA-002

**Story:** As a developer, I need a Fastify backend skeleton so that room and sync features have a home.

**Acceptance Criteria:**

- [x] `server/` package with **its own `package.json` + lockfile** (independent from frontend)
- [x] Fastify app boots, listens on `process.env.PORT` / `0.0.0.0`, has a health-check endpoint
- [x] Dockerfile for the backend service
- [x] Runs via `docker compose up` alongside Postgres

**Size:** M

**Implementation Notes:**

- `server/` package (Fastify 5, TypeScript, vitest) with its own `package.json` + `package-lock.json`, independent from the frontend.
- `server/src/app.ts` (`buildApp()` factory, testable via `inject()`) + `server/src/server.ts` (listens on `process.env.PORT`/`0.0.0.0`, graceful SIGINT/SIGTERM shutdown). `GET /health` returns `{ status, uptime, timestamp }`.
- `server/Dockerfile` — multi-stage production image (build TS → run compiled JS, non-root, tini). Verified: builds, boots, `/health` → 200.
- docker-compose services added: `install-server`, `backend` (with `postgres`), `test-server` (network-isolated). Postgres host port overridable via `POSTGRES_HOST_PORT` to avoid clashes.
- TDD: `server/src/__tests__/app.test.ts` (6 tests) — health 200/JSON/uptime/timestamp, 404 unknown route, logger flag. Verified in-container: type-check + 6 tests pass; `docker compose up backend` + postgres healthy.
- Backend deps install into a dedicated `server_node_modules` volume; Dockerfile.dev pre-creates the mountpoint node-owned.

---

### INFRA-004: DB Schema & Migrations

**Status:** `complete`
**Depends On:** INFRA-003

**Story:** As a developer, I need session/player tables so that rooms and rejoin tokens can be stored.

**Acceptance Criteria:**

- [x] `sessions` table: id, code, phase, status, state (JSONB), state_version, created_at, expires_at
- [x] `players` table: id, session_id, name, role, is_host, rejoin_token_hash, connected, joined_at
- [x] Partial unique index on `code` for non-ended rooms (codes recycle)
- [x] Migration tooling set up; expiry sweeper evicts expired rooms

**Size:** M

**Implementation Notes:**

- `node-pg-migrate` (SQL migrations) + `pg`; migration `server/migrations/1700000000000_initial-schema.sql` creates both tables.
- `sessions` partial unique index `sessions_active_code_unique` = `UNIQUE (code) WHERE status <> 'ended'` so codes recycle once a room ends; `players` has a one-host-per-session partial unique index and `ON DELETE CASCADE`.
- `server/src/db/pool.ts` (lazy pg pool from `DATABASE_URL`) + `server/src/db/sweeper.ts` (`sweepExpiredSessions` + `startExpirySweeper`); sweeper wired into `server.ts` startup (runs only when `DATABASE_URL` is set).
- `npm run migrate:up|down`; backend compose service waits for Postgres then auto-migrates on boot.
- TDD: `sweeper.test.ts` (5 tests). Verified against real Postgres in-container: up/down migrations apply, schema + partial index present, **code-recycling proven** (duplicate active code rejected; reusable after the first is ended). type-check + 11 server tests pass; full stack boots and `/health` 200.

---

### INFRA-005: Room Code & Rejoin-Token Services

**Status:** `complete`
**Depends On:** INFRA-004

**Story:** As a developer, I need code generation and token services so that rooms are joinable and rejoinable securely.

**Acceptance Criteria:**

- [x] Crockford-style code generator (excludes `0/O/1/I/L`, len 4, `ON CONFLICT` retry, length bump on repeated collision)
- [x] Rejoin token: 32-byte random, raw returned once, **only SHA-256 hash stored**, room-scoped
- [x] TTL logic: create now+2 days, slide on activity, drop to now+1h on round end
- [x] REST endpoints: `POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/rejoin`, `GET /rooms/:code`

**Size:** M

**Implementation Notes:**

- `server/src/rooms/`: `code.ts` (Crockford alphabet, `crypto.randomInt` generator, validator), `token.ts` (32-byte raw → SHA-256 hash, constant-time `verifyToken`), `ttl.ts` (now+2d / slide / now+1h), `repository.ts` (create with code-collision retry + length bump, join, rejoin, get/roster), `routes.ts` (Fastify plugin).
- Routes register in `buildApp({ db })`; `server.ts` passes the pool when `DATABASE_URL` is set. Responses never expose the token hash; raw rejoin token returned once.
- Tests: 26 unit tests (code/token/ttl) run offline in `test-server`; 9 integration tests (`routes.itest.ts`) run against real Postgres in the new `itest-server` compose service (separate `vitest.integration.config.ts`, runs migrations first).
- Verified in-container: 37 unit + 9 integration tests pass; all four REST endpoints exercised end-to-end (create/get/join/rejoin, incl. 400/404/401 paths).

---

### INFRA-006: WebSocket Gateway & RoomHub

**Status:** `complete`
**Depends On:** INFRA-005, INFRA-008

**Story:** As a developer, I need a WebSocket gateway so that live position/state messages flow between devices.

**Acceptance Criteria:**

- [x] WS connection lifecycle: `hello`/`welcome` handshake (rejoin token in first message, not URL), `ping`/`pong` heartbeat (clock offset)
- [x] In-memory `RoomHub` tracks connected players and latest positions per room
- [x] Presence events: `player.joined` / `player.left` / `player.presence`
- [x] Position coalescing + batched `pos.batch` broadcast on a tick
- [x] **Server-side withholding of hider-only data from seeker connections** (GPS, cards, pre-reveal zone center)
- [x] Server-computed `zone.breach` when a seeker enters the zone

**Size:** XL

**Implementation Notes:**

- `server/src/ws/roomHub.ts`: pure in-memory engine per room — membership, latest-position-per-player coalescing, `setZone`/`getZone`, ruled-out cell set-union, haversine `distanceMeters`, **`positionBatchFor(viewerId)` withholds the hider's position from seekers** (data-layer enforcement, not UI), `updatePosition` returns true on a new seeker breach (once-per-seeker).
- `registry.ts` (code → RoomHub, dispose-when-empty), `gateway.ts` (`/ws` route via `@fastify/websocket`: hello/welcome handshake with token in first message, presence joined/left, `pos`→breach, `zone.set`→`zone` broadcast, `ruledout.add`→union, host.action stub, position-batch tick, ping heartbeat, cleanup on close), `auth.ts` (DB-backed `ConnectionAuth` verifying rejoin token).
- Registered via `buildApp({ ws })`; `server.ts` wires `dbConnectionAuth(pool)`.
- TDD: `roomHub.test.ts` (15 unit) + `gateway.test.ts` (6 over real WebSocket on loopback, runs in the network-isolated unit suite). Verified in-container: 58 server tests pass; prod image builds, boots with gateway registered, `/health` ok.
- Note: in-memory RoomHub ⇒ API is single-instance for v1 (documented in INFRA-007). `host.action` phase handling is stubbed for MULTI-003b.
- [ ] Snapshots written to Postgres only on phase transitions / host actions (never per position frame)

**Size:** XL (consider splitting positions vs game-state handlers)

---

### INFRA-007: Railway Deployment

**Status:** `pending`
**Depends On:** INFRA-006

**Story:** As a developer, I need the app deployed to Railway so that players can use it from their own phones.

**Acceptance Criteria:**

- [ ] One Railway project with `web` (static `dist/`), `api` (Node, root dir `server/`), Postgres plugin (injects `DATABASE_URL`)
- [ ] `wss://` connects from the deployed PWA; CORS / WS-origin locked to the `web` URL
- [ ] `api` documented/configured as **single-instance** (in-memory RoomHub constraint for v1)
- [ ] Local docker-compose services map 1:1 to Railway services
- [ ] Build/start commands and env vars documented in DEVELOPMENT.md

**Size:** M

---

### INFRA-008: Shared DTO Package

**Status:** `complete`
**Depends On:** INFRA-003

**Story:** As a developer, I need shared TypeScript types for WS messages and synced state so that client and server never drift.

**Acceptance Criteria:**

- [x] `packages/shared` (or `shared/`) with zero-runtime-dep DTOs for all message types and the synced state shape
- [x] Imported by both the Vue client and the `server/` backend
- [x] Message types defined: handshake, presence, `pos`/`pos.batch`, `zone.set`/`zone`, `ruledout.add`/`ruledout`, `zone.breach`, host actions

**Size:** S

**Implementation Notes:**

- `shared/` package (`@jet-lag-stillwater/shared`), zero runtime deps. `shared/src/index.ts` defines core types (Role, GamePhase, Position, PublicPlayer, Zone, SyncedState), `ClientMessage`/`ServerMessage` discriminated unions covering hello/welcome, presence (joined/left/presence), `pos`/`pos.batch`, `zone.set`/`zone`, `ruledout.add`/`ruledout`, `zone.breach`, `phase`, host actions, errors, plus tiny type-guards + `QUARTER_MILE_M`.
- Imported by **server** (`repository.ts` types `sessions.state` as `SyncedState`) and **frontend** (`src/services/sync/protocol.ts` re-exports for SYNC-001). `@shared` alias wired in Vite, frontend tsconfig, and server tsconfig (TypeScript **project reference**, so clean builds order shared first).
- Production `server/Dockerfile` updated to include `shared/` and emit `dist/server.js`; frontend vitest excludes `server/**`.
- TDD: `shared/src/__tests__/messages.test.ts` (7 tests, run via the frontend vitest). Verified in-container: frontend 1261, server unit 37, server integration 9 — all pass; prod backend image builds + `/health` 200.

---

### SYNC-001: SyncService Abstraction

**Status:** `complete`
**Depends On:** INFRA-008

**Story:** As a developer, I need a swappable sync transport so that the app stays offline-first when no room is joined.

**Acceptance Criteria:**

- [x] `src/services/sync/` transport interface mirroring `PersistenceService`
- [x] `NoopSyncService` (default) — app behaves exactly as today with no room
- [x] `WsSyncService` — connects to the backend WS gateway
- [x] localStorage persistence keeps running in parallel; stores remain the local source of truth

**Size:** M

**Implementation Notes:**

- `src/services/sync/syncService.ts`: `SyncService` interface (reactive `status` ref, `connect/disconnect/send/onMessage`) mirroring the `PersistenceService` interface+factory pattern. Types come from `@shared` via `protocol.ts` (INFRA-008).
- `NoopSyncService` (default) — all no-ops, stays `disconnected`, so single-device/offline play is unchanged. `WsSyncService` — opens a WebSocket, sends the `hello` handshake on open (rejoin token in the first message, not the URL), fans inbound frames to subscribers, ignores malformed JSON. `createSyncService(kind)` factory defaults to noop.
- Purely additive: localStorage persistence and the stores are untouched (store↔sync wiring is SYNC-002).
- TDD: `syncService.spec.ts` (14 tests, WsSyncService exercised against a mock WebSocket). Verified in-container: 1275 frontend tests pass.

---

### SYNC-002: Store ↔ Sync Wiring

**Status:** `complete`
**Depends On:** SYNC-001, MULTI-002

**Story:** As a developer, I need the Pinia stores wired to the sync layer so that remote changes apply locally without loops.

**Acceptance Criteria:**

- [x] `useSync()` composable owns the active transport
- [x] Remote-applied mutations carry `origin:'remote'` to prevent echo loops
- [x] In a room, role derives from server `currentHiderId`; manual toggle retained for offline play
- [x] Reuses existing `gameStore`/`questionStore` shapes (no parallel state)

**Size:** L

**Implementation Notes:**

- `src/composables/useSync.ts`: `createSyncSession({ service })` (injectable) + `useSync()` app-wide singleton owning the active `SyncService`. Holds reactive self/players/phase/zone/positions/breachedSeekers/ruledOutCells; `role` is computed from the **server** `self.role` (not a local toggle) — the basis SYNC-003 locks down.
- **Echo-loop guard:** inbound `ServerMessage`s are applied via `applyRemote()` straight to refs and never re-emit; only the explicit `sendPosition/setZone/addRuledOutCells` helpers emit outbound (a test asserts a remote `zone` produces no `zone.set`).
- Wired into the lobby: `roomApi.getWsUrl()` derives ws/wss from the API base; `LobbyView` calls `sync.connect()` after create/join and `sync.disconnect()` on leave (REST lobby still works if the socket fails).
- TDD: `useSync.spec.ts` (9 tests). Verified in-container: 1306 frontend tests pass; type-check + build clean.
- Note: the offline manual hider/seeker toggle remains for single-device play; in-room role comes from the server.

---

### SYNC-003: Server-Enforced Device Role Lock (Anti-Cheat)

**Status:** `complete`
**Depends On:** INFRA-006, SYNC-002

**Story:** As a player, I need roles enforced by the server so that a seeker cannot switch to the hider view and see the hider's position and cards.

**Acceptance Criteria:**

- [x] In a room, the device's role comes from the server and is **bound to its rejoin token**
- [x] The free `currentViewRole` toggle in `GamePlayView.vue` (`data-testid="role-toggle"`) is **disabled/removed when in a room** (retained only for offline pass-the-phone play)
- [x] A device joined as seeker **cannot reach the hider view**
- [x] Hider-only data (GPS, cards, pre-reveal zone) is **withheld server-side** — verified by inspecting the seeker's raw WS frames, not just hidden in CSS/markup
- [x] Role can only change via server reassignment between rounds

**Size:** M

**Implementation Notes:**

- `GamePlayView.vue`: `isInRoom` (from `roomStore`) + `serverRole` (from `useSync().role`, bound to the device's rejoin-token-authenticated socket). A watcher forces `currentViewRole` to the server role while in a room.
- The free role toggle (`data-testid="role-toggle"`) is `v-if="!isInRoom"` — present only for offline pass-the-phone play. `switchToHider/switchToSeeker/handleTabChange` early-return in a room, so a seeker cannot flip to the hider view via buttons or tabs. A `role-locked-indicator` (🔒, with `aria-label`) shows in-room.
- Server-side withholding (last AC) is enforced + tested in INFRA-006 (`gateway.test.ts` inspects the seeker's actual `pos.batch` frames and asserts the hider is absent) — not just hidden in CSS.
- TDD: `GamePlayRoleLock.spec.ts` (4 tests). Verified in-container: 1310 frontend tests pass (offline toggle behavior unchanged — 46 RoleBasedViews tests still green).

**Size:** M

---

## Epic 14: Live Shared Map

Shared base map of Stillwater with live positions, hider zone, seeker ruled-out shading, and an end-game breach indicator. Base map is **pre-baked from OSM and bundled** for 100% offline use (see MULTI-001 design outcome). Approved mockup: two-view (seeker/hider) layout.

> **All cards with icon-only buttons must satisfy:** every icon-only control exposes a textual description (visible label or tooltip + `aria-label`).

---

### MAP-000: Bake Stylized Stillwater Base Map

**Status:** `pending`
**Depends On:** None

**Story:** As a developer, I need a pre-baked stylized Stillwater base map so that the map works fully offline without a tile server or API key.

**Acceptance Criteria:**

- [ ] One-time build script pulls Stillwater OSM data (streets + city limits)
- [ ] Renders an on-brand stylized base (image and/or baked GeoJSON), bundled into the app as a static asset checked into the repo
- [ ] Re-running the script regenerates the asset
- [ ] Base renders fully offline (no live tile server, no key)

**Size:** M

---

### MAP-001: Base Map Component

**Status:** `pending`
**Depends On:** MAP-000

**Story:** As a player, I need a map view so that I can see the game area and overlays.

**Acceptance Criteria:**

- [ ] Leaflet displays the pre-baked static base (MAP-000); overlays draw on top
- [ ] Mobile-first; readable in outdoor sunlight; new "Map" tab in bottom nav
- [ ] Bundled base asset cached via PWA/workbox so it's available offline after first load
- [ ] All icon-only controls have textual descriptions (label or tooltip + `aria-label`)

**Size:** M

---

### MAP-002: Static Stillwater Geo Data

**Status:** `pending`
**Depends On:** MAP-001

**Story:** As a player, I need bus stops, city limits, and POIs on the map so that I can reason about hiding spots.

**Acceptance Criteria:**

- [ ] City limits, OSU bus stops, and POIs (restaurants/schools/parks) rendered as overlay GeoJSON
- [ ] Data sourced from the user's exported Google My Maps (KML/GeoJSON) or OSM fallback
- [ ] Distinct from MAP-000 base cartography — this is the interactive game data layer
- [ ] Layer legend with text labels

**Size:** M

**Notes:**

- Sourcing subtask: user to export their custom Google My Maps layers as KML/GeoJSON.

---

### MAP-003: Live Position Markers

**Status:** `pending`
**Depends On:** MAP-002, MULTI-003a

**Story:** As a player, I need live position markers so that the hider can track seekers and seekers can see each other.

**Acceptance Criteria:**

- [ ] Uses browser Geolocation API to report own position
- [ ] Renders self + others from `pos.batch`
- [ ] **Hider sees seekers; seekers never see the hider's exact position** (enforced server-side per SYNC-003)
- [ ] Markers distinguish roles via the brand palette and have text labels

**Size:** L

---

### MAP-004: Hider Zone

**Status:** `pending`
**Depends On:** MAP-002

**Story:** As a hider, I need to set my hiding zone so that everyone shares the same ¼-mile boundary.

**Acceptance Criteria:**

- [ ] Hider picks a bus stop as the zone center
- [ ] Draws a ¼-mile (402 m) radius circle
- [ ] Zone syncs via `zone.set`; seekers see the declared zone
- [ ] Zone center/radius shown with text in a labeled sheet

**Size:** M

---

### MAP-005: Seeker Ruled-Out Shading

**Status:** `pending`
**Depends On:** MAP-002, MULTI-003a

**Story:** As a seeker, I need to shade ruled-out regions so that the team can narrow the search.

**Acceptance Criteria:**

- [ ] **Answer-driven auto-shading** for Radar / Measuring / Thermometer answers (geometry relative to seeker position)
- [ ] **Manual freehand shading** override
- [ ] Stored/synced as geohash grid cells (sync = set union)
- [ ] Shading toolbar controls all have textual descriptions/labels (incl. undo)

**Size:** L

---

### MAP-006: End-Game Breach Indicator

**Status:** `pending`
**Depends On:** MAP-004, MAP-003

**Story:** As a hider, I need a clear visual alert when seekers enter my zone so that I know the end game has begun.

**Acceptance Criteria:**

- [ ] When a seeker enters the zone (server `zone.breach`), the zone turns red and pulses + an alert banner appears
- [ ] Ties into the existing `enterHidingZone()` transition in `gameStore`
- [ ] Indicator is announced for screen readers (not color-only)

**Size:** M

---

## Backlog Summary

| Epic                           | Stories | Complete | Remaining |
| ------------------------------ | ------- | -------- | --------- |
| 0: Project Foundation          | 9       | 9        | 0         |
| 1: Question Tracking           | 11      | 11       | 0         |
| 2: Timers                      | 4       | 4        | 0         |
| 3: Card Management             | 12      | 12       | 0         |
| 4: Game State                  | 7       | 7        | 0         |
| 5: Mobile UX Polish            | 6       | 6        | 0         |
| 6: Developer Tools             | 1       | 1        | 0         |
| 7: Question UX Improvements    | 2       | 2        | 0         |
| 8: Physical Play & Standalone  | 3       | 3        | 0         |
| 9: User Guides                 | 2       | 2        | 0         |
| 10: Multiplayer Sync           | 5       | 1        | 4         |
| 11: Branding & Visual Identity | 2       | 2        | 0         |
| 12: Bug Fixes                  | 1       | 1        | 0         |
| 13: Backend & Infrastructure   | 11      | 0        | 11        |
| 14: Live Shared Map            | 7       | 0        | 7         |
| **Total**                      | **83**  | **61**   | **22**    |

---

## Dependency Graph

Epics 0–9, 11, 12 are complete. Remaining work is the multiplayer/backend/map track:

```
MULTI-001 ✅ (design) ─→ INFRA-001 ─┬─→ INFRA-003 ─┬─→ INFRA-004 ─→ INFRA-005 ─→ INFRA-006 ─→ INFRA-007
                    INFRA-002 ──────┘              ├─→ INFRA-008 ─→ SYNC-001 ─→ SYNC-002 ─→ SYNC-003
                                                   └─(INFRA-006 needs INFRA-008)
MULTI-002 (needs INFRA-003/004/005) ─→ SYNC-002
INFRA-006 + SYNC-002 ─→ MULTI-003a ─→ MULTI-003b ─→ MULTI-004
MAP-000 ─→ MAP-001 ─→ MAP-002 ─┬─→ MAP-003 (needs MULTI-003a) ─┐
                               ├─→ MAP-004 ──────────────────────┴─→ MAP-006
                               └─→ MAP-005 (needs MULTI-003a)
```

```
FOUND-001 (no deps) ─┬─→ FOUND-002 ─┬─→ FOUND-003 ─→ ...
                     │              ├─→ FOUND-005 ─→ FOUND-009 ✅
                     │              ├─→ FOUND-008 ─→ Q-002c, GS-001 ─┬─→ GS-002, GS-003
                     │              │                                ├─→ GS-005 ─→ GS-004 ─→ GS-006
                     │              │                                ├─→ GS-007
                     │              │                                ├─→ CARD-007d
                     │              │                                └─→ CARD-008
                     │              └─→ T-001 ─┬─→ T-002, T-003 ─┬─→ GS-005
                     │                         │                 └─→ CARD-007d
                     │                         ├─→ CARD-006b
                     │                         └─→ GS-007
                     ├─→ FOUND-004 ─┬─→ FOUND-006 ─→ FOUND-009 ✅
                     │              └─→ UX-001
                     ├─→ FOUND-007
                     ├─→ UX-004
                     ├─→ Q-001 ─→ Q-001a ─→ Q-002a ─→ Q-002b ─→ Q-002c ─→ Q-005
                     │                              └─→ Q-003a ─→ Q-003b ─→ Q-004a ─→ Q-004b ─→ Q-006
                     └─→ CARD-001 ─┬─→ CARD-002 ─┬─→ CARD-003, CARD-004, CARD-005
                                   │             ├─→ CARD-007a, CARD-007b, CARD-007c, CARD-007d
                                   │             └─→ CARD-008
                                   └─→ CARD-006a ─→ CARD-006b
```

### Currently Ready (No Pending Dependencies)

**Epic 6: Developer Tools**

- ~~**DEV-001**: Skip Hiding Period Button~~ ✅ COMPLETE

**Epic 7: Question UX Improvements**

- ~~**QUX-001**: Lock Questions During Hiding Period~~ ✅ COMPLETE
- ~~**QUX-002**: Collapse Question Categories by Default~~ ✅ COMPLETE

**Epic 8: Physical Play & Standalone Mode**

- ~~**PHYS-001**: Manual Card Entry for Hiders~~ ✅ COMPLETE
- ~~**PHYS-002**: Manual Curse Activation for Seekers~~ ✅ COMPLETE
- ~~**PHYS-003**: Standalone Mode Documentation~~ ✅ COMPLETE

**Epic 9: User Guides**

- ~~**GUIDE-001**: Hider Mode User Guide~~ ✅ COMPLETE
- ~~**GUIDE-002**: Seeker Mode User Guide~~ ✅ COMPLETE

**Epic 5: Mobile UX Polish**

- ~~**UX-005**: Auto-focus Player Name Input After Adding Player~~ ✅ COMPLETE

**Epic 10: Multiplayer Sync**

- ~~**MULTI-001**: Multiplayer Architecture Planning~~ ✅ COMPLETE (design captured)
- **MULTI-002**: Room Creation & Join Flow (depends on INFRA-003/004/005) ⏳
- **MULTI-003a**: Real-Time Position Sync (depends on MULTI-002, INFRA-006, SYNC-002) ⏳
- **MULTI-003b**: Real-Time Game-State Sync (depends on MULTI-003a) ⏳
- **MULTI-004**: Offline Handling & Reconnection (depends on MULTI-003b) ⏳

**Epic 11: Branding & Visual Identity**

- ~~**BRAND-001**: Create Jet Lag Stillwater Edition Logo Component~~ ✅ COMPLETE
- ~~**BRAND-002**: Display Logo on Game and Setup Pages~~ ✅ COMPLETE

**Epic 12: Bug Fixes**

- ~~**BUG-001**: Fix Incorrect "Hand Limit Reached" Warning in Card Draw Modal~~ ✅ COMPLETE

**Epic 13: Backend & Infrastructure**

- **INFRA-001**: Docker Sandbox for Dev & Test (no dependencies) - READY
- **INFRA-002**: npm Hardening (no dependencies) - READY
- **INFRA-003**..**008**, **SYNC-001**..**003**: backend + client sync glue ⏳

**Epic 14: Live Shared Map**

- **MAP-000**: Bake Stylized Stillwater Base Map (no dependencies) - READY
- **MAP-001**..**006**: base map component, geo data, positions, zone, shading, breach indicator ⏳

✅ = dependency complete | ⏳ = waiting on other new stories | READY = no pending dependencies

---

## Ralph Wiggum Workflow Notes

**Between iterations:**

1. Read this file to see remaining `pending` cards
2. Check which cards have all dependencies marked `complete`
3. Select the optimal card based on: unblocking potential, logical grouping, foundation-first
4. Work on exactly one card per iteration
5. Mark card `complete` when done
6. Stop and wait for human checkpoint

**Do NOT** follow a predetermined order. Analyze dependencies each iteration.

---

_Last updated: June 26, 2026 - Completed MULTI-001 (multiplayer architecture design); added Epic 13 (Backend & Infrastructure) and Epic 14 (Live Shared Map); split MULTI-003 into 003a/003b_
