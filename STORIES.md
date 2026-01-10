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

**Status:** `pending`
**Depends On:** FOUND-001

**Story:** As a developer, I need Playwright configured so that I can write browser-based end-to-end tests.

**Acceptance Criteria:**
- [ ] Playwright installed (`@playwright/test`)
- [ ] Playwright config file created (`playwright.config.js`)
- [ ] `npm run test:e2e` command runs E2E tests
- [ ] Tests run against local dev server
- [ ] Sample E2E test passes (e.g., visit homepage, verify title)
- [ ] HTML test report generated after runs

**Size:** M

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

**Status:** `pending`
**Depends On:** Q-002c

**Story:** As a player (hider or seeker), I need to see all previously asked questions and answers so that I can reference what's been revealed.

**Acceptance Criteria:**
- [ ] View shows all asked questions in reverse chronological order
- [ ] Each entry shows: question, answer, timestamp, category
- [ ] Vetoed questions marked distinctly (returned to available)
- [ ] List is scrollable
- [ ] Tapping an entry shows full details
- [ ] Option to filter by category
- [ ] Accessible from both hider and seeker views

**Size:** M

---

### Q-006: Re-ask Question with Double Cost

**Status:** `pending`
**Depends On:** Q-004b

**Story:** As a seeker, I need the option to re-ask a previously asked question at double the card cost so that I can get updated information.

**Acceptance Criteria:**
- [ ] Previously asked questions show "Re-ask (2x cost)" option
- [ ] Re-asking shows confirmation with doubled draw/keep values
- [ ] Hider draws double the normal cards when re-asked question is answered
- [ ] Re-asked questions tracked separately in history (marked as re-ask)
- [ ] Vetoed questions can be re-asked at normal cost (not doubled)

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

**Status:** `pending`
**Depends On:** T-001, FOUND-003

**Story:** As a player (hider or seeker), I need a 30-minute hiding period countdown so that both sides know when seeking begins.

**Acceptance Criteria:**
- [ ] Timer counts down from 30:00
- [ ] Timer displays in MM:SS format
- [ ] Timer visible on both hider and seeker views
- [ ] Seekers are frozen during this period (can't move or ask questions)
- [ ] Visual/audio alert at 5 minutes remaining
- [ ] Visual/audio alert when timer expires (seeking begins)
- [ ] Timer can be paused (game pause rule)
- [ ] Timer state persists if app is closed

**Size:** M

---

### T-003: Hiding Duration Timer

**Status:** `pending`
**Depends On:** T-001

**Story:** As a player, I need to track how long the hider has been hiding so that we can determine the winner.

**Acceptance Criteria:**
- [ ] Timer counts up from 00:00:00
- [ ] Timer starts when hiding period ends
- [ ] Timer stops when hider is found
- [ ] Displays in HH:MM:SS format
- [ ] Timer can be paused
- [ ] Final time is recorded for scoring

**Size:** M

---

### T-004: Question Response Timer

**Status:** `pending`
**Depends On:** T-001, Q-004

**Story:** As a player (seeker or hider), I need a countdown timer after a question is asked so that both sides know the response deadline.

**Acceptance Criteria:**
- [ ] Timer starts when question is submitted
- [ ] Countdown from 5:00 (or 10:00 for photo questions)
- [ ] Timer visible on both hider and seeker views
- [ ] Visual alert when time is running low (< 1 minute)
- [ ] Notification when timer expires (for both roles)
- [ ] Timer clears when answer is recorded

**Size:** S

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

**Status:** `pending`
**Depends On:** CARD-002, FOUND-003

**Story:** As a hider, I need to see my current hand of cards so that I can plan plays.

**Acceptance Criteria:**
- [ ] Cards displayed in a mobile-friendly layout
- [ ] Each card shows: type, name, effect summary
- [ ] Visual distinction between time bonus, powerup, curse
- [ ] Hand limit indicator (e.g., "4/6 cards")
- [ ] Tapping a card shows full details and play option

**Size:** M

---

### CARD-004: Card Draw Simulation

**Status:** `pending`
**Depends On:** CARD-002

**Story:** As a hider, I need to draw cards when questions are answered so that I get new options.

**Acceptance Criteria:**
- [ ] Draw count based on question category
- [ ] Cards drawn from simulated deck (weighted random)
- [ ] Animation/feedback when cards are drawn
- [ ] Hand limit enforced (must discard if over)

**Size:** M

---

### CARD-005: Time Bonus Calculator

**Status:** `pending`
**Depends On:** CARD-002

**Story:** As a hider, I need to see my total time bonus so that I know my potential score.

**Acceptance Criteria:**
- [ ] Sum of all time bonus cards in hand
- [ ] Displayed prominently on hider view
- [ ] Updates when cards drawn or discarded

**Size:** S

---

### CARD-006a: Curse Display

**Status:** `pending`
**Depends On:** CARD-001, FOUND-003

**Story:** As a seeker, I need to see which curses are currently active so that I know what restrictions apply.

**Acceptance Criteria:**
- [ ] Display list of active curses on seeker view
- [ ] Each curse shows: name, description, clear condition
- [ ] Until-found curses show as persistent (no clear option)
- [ ] Hider can play curse card which adds it to seeker's active curse list

**Size:** S

**Tests to Write:**
```typescript
describe('CurseDisplay', () => {
  it('should display active curses')
  it('should show curse name and description')
  it('should show clear condition')
  it('should add curse when hider plays card')
})
```

---

### CARD-006b: Curse Clearing

**Status:** `pending`
**Depends On:** CARD-006a, T-001

**Story:** As a seeker, I need curses to clear when conditions are met so that restrictions are lifted.

**Acceptance Criteria:**
- [ ] Time-based curses show countdown timer (auto-clear when expired)
- [ ] Action-based curses have "Mark Complete" button for manual clearing
- [ ] Curse clears from list when condition is met
- [ ] Visual/audio notification when curse is cleared

**Size:** S

**Tests to Write:**
```typescript
describe('CurseClearing', () => {
  it('should show countdown for time-based curses')
  it('should auto-clear time-based curses when expired')
  it('should allow manual clearing of action-based curses')
  it('should notify when curse is cleared')
})
```

---

### CARD-007a: Discard/Draw Powerup Effect

**Status:** `pending`
**Depends On:** CARD-002

**Story:** As a hider, I need to play the Discard/Draw powerup so that I can exchange unwanted cards for new ones.

**Acceptance Criteria:**
- [ ] Discard/Draw card can be played from hand
- [ ] UI allows selecting which cards to discard (multi-select)
- [ ] After discarding, draw equal number of new cards
- [ ] Confirmation before finalizing the play
- [ ] Card removed from hand after playing
- [ ] Visual feedback showing cards discarded and drawn

**Size:** S

**Rules Reference:**
- See GAME_RULES.md "Powerup Cards" section

**Tests to Write:**
```typescript
describe('Discard/Draw Powerup', () => {
  it('should allow selecting multiple cards to discard')
  it('should draw equal number of new cards')
  it('should remove powerup card after playing')
  it('should require confirmation before playing')
})
```

---

### CARD-007b: Draw 1, Expand Powerup Effect

**Status:** `pending`
**Depends On:** CARD-002

**Story:** As a hider, I need to play the Draw 1, Expand powerup so that I can draw a card and permanently increase my hand size.

**Acceptance Criteria:**
- [ ] Draw 1, Expand card can be played from hand
- [ ] Playing draws one card immediately
- [ ] Hand limit permanently increased by 1 (persists for rest of game)
- [ ] Hand limit indicator updates to show new limit
- [ ] Confirmation before playing
- [ ] Card removed from hand after playing

**Size:** S

**Rules Reference:**
- See GAME_RULES.md "Powerup Cards" section

**Tests to Write:**
```typescript
describe('Draw 1, Expand Powerup', () => {
  it('should draw one card when played')
  it('should increase hand limit by 1')
  it('should persist increased hand limit')
  it('should remove powerup card after playing')
})
```

---

### CARD-007c: Duplicate Powerup Effect

**Status:** `pending`
**Depends On:** CARD-002

**Story:** As a hider, I need to play the Duplicate powerup so that I can copy another card in my hand.

**Acceptance Criteria:**
- [ ] Duplicate card can be played from hand
- [ ] UI allows selecting which card in hand to copy
- [ ] Creates a copy of the selected card in hand
- [ ] If duplicating a time bonus, the copy has doubled value
- [ ] Confirmation before playing
- [ ] Original Duplicate card removed after playing

**Size:** S

**Rules Reference:**
- See GAME_RULES.md "Powerup Cards" section
- Duplicate can copy any time bonus, doubling its value

**Tests to Write:**
```typescript
describe('Duplicate Powerup', () => {
  it('should allow selecting a card to copy')
  it('should create copy of selected card')
  it('should double time bonus value when duplicating time bonus')
  it('should remove powerup card after playing')
})
```

---

### CARD-007d: Move Powerup Effect

**Status:** `pending`
**Depends On:** CARD-002, GS-001, T-003

**Story:** As a hider, I need to play the Move powerup so that I can establish a new hiding zone while seekers wait.

**Acceptance Criteria:**
- [ ] Move card can be played from hand
- [ ] Playing pauses the hiding duration timer
- [ ] Seekers view shows notification: "Hider is moving - stay put"
- [ ] Hider can travel to new location and establish new hiding zone
- [ ] "Confirm New Zone" action resumes hiding timer
- [ ] Move state persists if app is closed mid-move
- [ ] Card removed from hand after playing

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

**Status:** `pending`
**Depends On:** CARD-002, GS-001

**Story:** As a hider, I need to play Time Trap cards to designate stations as traps so that I gain bonus time if seekers visit them.

**Acceptance Criteria:**
- [ ] Time Trap card can be played from hand
- [ ] Playing prompts hider to select/enter a transit station name
- [ ] Trapped station is publicly announced (seekers see it)
- [ ] If seekers visit trapped station, hider gains bonus time (amount TBD from rulebook)
- [ ] "Triggered" traps show as triggered with time bonus applied
- [ ] Multiple traps can be active simultaneously
- [ ] Traps persist across app restarts

**Size:** M

**Rules Reference:**
- See GAME_RULES.md "Time Trap Cards (Expansion Pack)" section
- Can be used as misdirection (trap a station far from hiding spot)

**Tests to Write:**
```typescript
describe('Time Trap Cards', () => {
  it('should allow setting a station as trapped')
  it('should publicly display trapped stations')
  it('should grant bonus time when seekers visit trap')
  it('should mark trap as triggered after visit')
  it('should allow multiple active traps')
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

**Status:** `pending`
**Depends On:** GS-001, FOUND-003

**Story:** As a player, I need to set up a new game so that tracking can begin.

**Acceptance Criteria:**
- [ ] Enter player names (2-4 players)
- [ ] Select game size (Small for Stillwater)
- [ ] Randomize or select first hider
- [ ] Confirmation before starting

**Size:** M

---

### GS-003: Role-Based Views

**Status:** `pending`
**Depends On:** GS-001, Q-003b, CARD-003

**Story:** As a player, I need to see information relevant to my current role (hider or seeker).

**Acceptance Criteria:**
- [ ] Hider view shows: cards, time bonus, GPS toggle (future)
- [ ] Seeker view shows: questions, answers, timers
- [ ] Easy toggle to switch views (for single-device play)
- [ ] Current role clearly indicated in UI

**Size:** M

---

### GS-004: Round Summary

**Status:** `pending`
**Depends On:** GS-001, T-003

**Story:** As a player, I need to see a summary when a round ends so that scores are clear.

**Acceptance Criteria:**
- [ ] Shows hider's final hiding time
- [ ] Shows time bonuses applied
- [ ] Shows total score for round
- [ ] Running leaderboard of all players
- [ ] Option to start next round or end game

**Size:** M

---

### GS-005: End Game Flow

**Status:** `pending`
**Depends On:** GS-001, T-003

**Story:** As a player, I need the app to handle the end game sequence so that rounds conclude properly when the hider is found.

**Acceptance Criteria:**
- [ ] "Enter Hiding Zone" action triggers end game phase
- [ ] End game phase shows: seekers are in zone, searching for hider
- [ ] "Hider Found" action stops the hiding duration timer
- [ ] Records final hiding time for scoring
- [ ] Transitions to round-complete phase (triggers GS-004 Round Summary)
- [ ] Enforces rule: Photo/Tentacles questions disabled during end game phase

**Size:** M

**Rules Reference:**
- See GAME_RULES.md "End Game" section
- Triggered when seekers enter hiding zone and leave transit
- Seekers must spot hider AND be within 5 feet to win

**Tests to Write:**
```typescript
describe('End Game Flow', () => {
  it('should transition to end-game phase when zone entered')
  it('should stop hiding timer when hider found')
  it('should record final hiding time')
  it('should disable Photo questions in end-game phase')
  it('should transition to round-complete after hider found')
})
```

---

### GS-006: Multi-Round Scoring & Winner Declaration

**Status:** `pending`
**Depends On:** GS-004

**Story:** As a player, I need the app to track scores across all rounds and declare a winner so that we know who won the game.

**Acceptance Criteria:**
- [ ] Track total hiding time per player across all rounds
- [ ] Track which players have been hider (rotation tracking)
- [ ] "End Game" option available after all players have been hider
- [ ] Final results screen shows all players ranked by total time
- [ ] Winner clearly announced (longest total hiding time)
- [ ] Option to start new game or return to setup

**Size:** S

**Tests to Write:**
```typescript
describe('Multi-Round Scoring', () => {
  it('should track cumulative hiding time per player')
  it('should track which players have been hider')
  it('should allow ending game after all players rotated')
  it('should rank players by total hiding time')
  it('should declare winner with longest time')
})
```

---

### GS-007: Unified Game Pause/Resume

**Status:** `pending`
**Depends On:** GS-001, T-001

**Story:** As a player, I need to pause the entire game so that all timers stop for safety or comfort breaks.

**Acceptance Criteria:**
- [ ] "Pause Game" action available during active gameplay
- [ ] Pausing stops ALL timers (hiding period, hiding duration, response timer)
- [ ] Visual indicator shows game is paused
- [ ] "Resume Game" action restarts all timers from where they stopped
- [ ] Pause state persists if app is closed
- [ ] Both hider and seeker views show pause status

**Size:** S

**Rules Reference:**
- See RESEARCH_NOTES.md "Pausing" section
- Game can be paused if needed for safety/comfort
- When paused, ALL timers stop

**Tests to Write:**
```typescript
describe('Game Pause/Resume', () => {
  it('should pause all active timers')
  it('should show pause indicator')
  it('should resume all timers from paused state')
  it('should persist pause state across app restart')
})
```

---

## Epic 6: Mobile UX Polish

User experience improvements.

---

### UX-001: Responsive Layout

**Status:** `pending`
**Depends On:** FOUND-001, FOUND-004

**Story:** As a player, I need the app to work well on my phone so that I can use it during gameplay.

**Acceptance Criteria:**
- [ ] All views work on screens 320px and up
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scrolling on main views
- [ ] Text readable without zooming
- [ ] Tested on iOS Safari and Android Chrome

**Size:** M

---

### UX-002: Navigation Structure

**Status:** `pending`
**Depends On:** GS-003

**Story:** As a player, I need intuitive navigation so that I can quickly access different features.

**Acceptance Criteria:**
- [ ] Bottom tab navigation for main sections
- [ ] Tabs: Questions, Timers, Cards (hider), History
- [ ] Current tab clearly indicated
- [ ] Smooth transitions between views

**Size:** M

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

**Status:** `pending`
**Depends On:** FOUND-001

**Story:** As a player, I need a consistent visual theme with distinct category colors so that the app is easy to navigate and visually appealing.

**Acceptance Criteria:**
- [ ] Tailwind theme extended with custom color palette
- [ ] Primary accent color defined (inspired by Jet Lag branding)
- [ ] Each question category has a distinct, accessible color
- [ ] Dark/navy background theme for game feel
- [ ] All colors meet WCAG 2.1 AA contrast requirements
- [ ] Category colors work in bright outdoor sunlight
- [ ] Design tokens documented in Tailwind config

**Size:** S

**Design Notes:**
- See RESEARCH_NOTES.md "Visual Design Research" section
- See RESEARCH_NOTES.md "Question Category Colors (From Nebula Show)" for exact hex values
- See RESEARCH_NOTES.md "Question Icon Reference" for icon descriptions per category
- Official Jet Lag logo palette: #1a1a2e (navy), #c73e3e (red), #f07d2e (orange), #f5b830 (gold), #00aaff (cyan)
- Prioritize accessibility and outdoor visibility

---

## Backlog Summary

| Epic | Stories | Complete | Remaining |
|------|---------|----------|-----------|
| 0: Project Foundation | 9 | 4 | 5 |
| 1: Question Tracking | 11 | 9 | 2 |
| 2: Timers | 4 | 1 | 3 |
| 3: Card Management | 12 | 2 | 10 |
| 4: Game State | 7 | 1 | 6 |
| 5: Mobile UX Polish | 4 | 0 | 4 |
| **Total** | **47** | **17** | **30** |

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

With FOUND-001, FOUND-002, FOUND-003, FOUND-008, Q-001, Q-001a, Q-002a, Q-002b, Q-002c, Q-003a, Q-003b, Q-004a, Q-004b, GS-001, T-001, CARD-001, and CARD-002 complete, the following cards are now ready:
- **FOUND-004**: Configure Playwright for E2E Testing
- **FOUND-005**: Configure Pre-Commit Hooks
- **FOUND-007**: Configure PWA Support
- **T-002**: Hiding Period Timer
- **T-003**: Hiding Duration Timer
- **T-004**: Question Response Timer (newly unblocked by Q-004b)
- **Q-005**: Question History View
- **Q-006**: Re-ask Question with Double Cost (newly unblocked by Q-004b)
- **CARD-003**: Card Hand Display
- **CARD-004**: Card Draw Simulation
- **CARD-005**: Time Bonus Calculator
- **CARD-006a**: Curse Display
- **CARD-007a**: Discard/Draw Powerup Effect
- **CARD-007b**: Draw 1, Expand Powerup Effect
- **CARD-007c**: Duplicate Powerup Effect
- **CARD-008**: Time Trap Card Implementation
- **UX-004**: Visual Design System
- **GS-002**: Game Setup Flow
- **GS-007**: Unified Game Pause/Resume

**Note:** Q-004b completion unblocks T-004 (Question Response Timer) and Q-006 (Re-ask Question with Double Cost).

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
