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

**Status:** `pending`
**Depends On:** FOUND-002

**Story:** As a developer, I need pre-commit hooks so that code quality is enforced before commits.

**Acceptance Criteria:**
- [ ] Husky installed and initialized
- [ ] lint-staged installed and configured
- [ ] Pre-commit hook runs: ESLint, Prettier, TypeScript check
- [ ] Pre-commit hook runs unit tests on staged files
- [ ] Commits are blocked if any check fails
- [ ] Hook can be bypassed with `--no-verify` (for emergencies only)

**Size:** M

---

### FOUND-006: Configure GitHub Actions CI

**Status:** `pending`
**Depends On:** FOUND-002, FOUND-004

**Story:** As a developer, I need a CI pipeline so that all tests run automatically on push and PR.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` created
- [ ] CI triggers on: push to `main`, all pull requests
- [ ] CI steps: install deps → lint → type check → unit tests → E2E tests
- [ ] CI reports test results and coverage
- [ ] Failed CI blocks PR merge (branch protection rule)
- [ ] CI completes in reasonable time (< 5 minutes target)

**Size:** M

---

### FOUND-007: Configure PWA Support

**Status:** `pending`
**Depends On:** FOUND-001

**Story:** As a developer, I need PWA configuration so that the app can be installed and work offline.

**Acceptance Criteria:**
- [ ] `vite-plugin-pwa` installed and configured
- [ ] Web app manifest created (name, icons, theme color, display mode)
- [ ] Service worker registers successfully
- [ ] App is installable (shows browser install prompt)
- [ ] App loads offline after initial visit (cached assets)
- [ ] Lighthouse PWA audit passes core requirements

**Size:** M

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

**Status:** `pending`
**Depends On:** FOUND-005, FOUND-006

**Story:** As a developer, I need automated secret detection so that credentials are never accidentally committed to this public repository.

**Acceptance Criteria:**
- [ ] Secret scanning tool installed (e.g., gitleaks, truffleHog, or detect-secrets)
- [ ] Pre-commit hook scans staged files for secrets
- [ ] CI pipeline includes secret scanning step
- [ ] Commits/PRs blocked if secrets detected
- [ ] `.secretsignore` or equivalent for false positive exclusions
- [ ] Documentation in DEVELOPMENT.md on how to handle detected secrets

**Size:** S

**Tools to Consider:**
- `gitleaks` - Fast, standalone binary, easy CI integration
- `truffleHog` - Python-based, good regex patterns
- `detect-secrets` - Yelp's tool, baseline file approach

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

**Status:** `pending`
**Depends On:** T-002, CARD-006b

**Story:** As a player, I need timely notifications so that I don't miss important game events.

**Acceptance Criteria:**
- [ ] In-app toast notifications for actions
- [ ] Sound alerts for timer events (optional, toggleable)
- [ ] Vibration feedback on mobile (optional)
- [ ] Curse cleared notification

**Size:** M

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

## Backlog Summary

| Epic | Stories | Complete | Remaining |
|------|---------|----------|-----------|
| 0: Project Foundation | 9 | 5 | 4 |
| 1: Question Tracking | 11 | 11 | 0 |
| 2: Timers | 4 | 4 | 0 |
| 3: Card Management | 12 | 12 | 0 |
| 4: Game State | 7 | 7 | 0 |
| 5: Mobile UX Polish | 4 | 3 | 1 |
| **Total** | **47** | **42** | **5** |

---

## Dependency Graph

Cards with no pending dependencies are **ready** to work on.

```
FOUND-001 (no deps) ─┬─→ FOUND-002 ─┬─→ FOUND-003 ─→ ...
                     │              ├─→ FOUND-005
                     │              ├─→ FOUND-008 ─→ Q-002c, GS-001 ─┬─→ GS-002, GS-003
                     │              │                                ├─→ GS-005 ─→ GS-004 ─→ GS-006
                     │              │                                ├─→ GS-007
                     │              │                                ├─→ CARD-007d
                     │              │                                └─→ CARD-008
                     │              └─→ T-001 ─┬─→ T-002, T-003 ─┬─→ GS-005
                     │                         │                 └─→ CARD-007d
                     │                         ├─→ CARD-006b
                     │                         └─→ GS-007
                     ├─→ FOUND-004 ─┬─→ FOUND-006
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

With FOUND-001, FOUND-002, FOUND-003, FOUND-004, FOUND-008, Q-001, Q-001a, Q-002a, Q-002b, Q-002c, Q-003a, Q-003b, Q-004a, Q-004b, Q-005, Q-006, GS-001, GS-002, GS-003, GS-004, GS-005, GS-006, GS-007, T-001, T-002, T-003, T-004, CARD-001, CARD-002, CARD-003, CARD-004, CARD-005, CARD-006a, CARD-006b, CARD-007a, CARD-007b, CARD-007c, CARD-007d, CARD-008, UX-001, UX-002, and UX-004 complete, the following cards are now ready:
- **FOUND-005**: Configure Pre-Commit Hooks
- **FOUND-006**: Configure GitHub Actions CI
- **FOUND-007**: Configure PWA Support
- **UX-003**: Notifications and Alerts

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

*Last updated: January 2026*
