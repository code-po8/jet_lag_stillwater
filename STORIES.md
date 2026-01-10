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

**Status:** `pending`
**Depends On:** Q-002a

**Story:** As a player, I need actions to ask, answer, and veto questions so that the game flow is tracked.

**Acceptance Criteria:**
- [ ] `askQuestion(questionId)` marks question as pending, returns draw/keep values
- [ ] `answerQuestion(questionId, answer)` records answer, moves to asked
- [ ] `vetoQuestion(questionId)` returns question to available (hider still gets cards)
- [ ] Prevent new questions while one is pending

**Size:** S

**Tests to Write:**
```typescript
describe('questionStore actions', () => {
  it('should mark a question as pending when asked')
  it('should return draw/keep values when question asked')
  it('should prevent new questions while one is pending')
  it('should record answer and move question to asked')
  it('should return vetoed question to available')
})
```

---

### Q-002c: Question Store Persistence

**Status:** `pending`
**Depends On:** Q-002b, FOUND-008

**Story:** As a player, I need question state to persist so that I don't lose progress if the app closes.

**Acceptance Criteria:**
- [ ] Store persists to localStorage via persistence service
- [ ] Store rehydrates on app load
- [ ] Pending question state preserved across restarts

**Size:** S

**Tests to Write:**
```typescript
describe('questionStore persistence', () => {
  it('should persist state to localStorage')
  it('should rehydrate state on load')
  it('should preserve pending question across restart')
})
```

---

### Q-003a: Question List Display

**Status:** `pending`
**Depends On:** Q-002a, FOUND-003

**Story:** As a player, I need to see all questions grouped by category so that I can browse what's available.

**Acceptance Criteria:**
- [ ] Component displays questions grouped by category
- [ ] Each category shows: name, draw/keep values
- [ ] Questions show: text
- [ ] Component is mobile-friendly (touch targets, scrollable)
- [ ] Accessible from both hider and seeker views

**Size:** S

**Tests to Write:**
```typescript
describe('QuestionList display', () => {
  it('should display all categories')
  it('should show questions within each category')
  it('should display draw/keep values for each category')
})
```

---

### Q-003b: Question Status Indicators

**Status:** `pending`
**Depends On:** Q-003a, Q-002b

**Story:** As a player, I need to see question status (asked/available/pending) so that I know what can still be asked.

**Acceptance Criteria:**
- [ ] Questions show: asked/available/pending status
- [ ] Asked questions are visually distinct (grayed out, strikethrough, or hidden)
- [ ] Pending question (awaiting answer) highlighted
- [ ] Disable asking new questions while one is pending
- [ ] Emit event when question selected

**Size:** S

**Tests to Write:**
```typescript
describe('QuestionList status', () => {
  it('should gray out asked questions')
  it('should highlight pending question')
  it('should disable selection while question is pending')
  it('should emit event when question selected')
})
```

---

### Q-004a: Ask Question Modal

**Status:** `pending`
**Depends On:** Q-003b

**Story:** As a seeker, I need to select a question and confirm asking it so that the hider knows to respond.

**Acceptance Criteria:**
- [ ] Tapping a question opens a confirmation modal
- [ ] Modal shows: question text, category, draw/keep values
- [ ] "Ask" button marks question as pending, starts response timer
- [ ] "Cancel" button closes modal without asking
- [ ] Once pending, modal for recording answer appears
- [ ] Toast/notification confirms question was asked

**Size:** S

---

### Q-004b: Answer and Veto/Randomize Handling

**Status:** `pending`
**Depends On:** Q-004a, CARD-002

**Story:** As a player, I need to record the answer and handle Veto/Randomize responses so that the game flow continues.

**Acceptance Criteria:**
- [ ] "Submit Answer" records answer, triggers hider card draw
- [ ] Hider can play Veto (returns question to available, still draws cards)
- [ ] Hider can play Randomize (replaces with random question from same category)
- [ ] Toast/notification confirms answer was recorded

**Size:** S

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

## Epic 2: Timers

Game timing functionality.

---

### T-001: Create Timer Composable

**Status:** `pending`
**Depends On:** FOUND-002

**Story:** As a developer, I need a reusable timer composable so that timing logic is consistent across the app.

**Acceptance Criteria:**
- [ ] `useTimer` composable created
- [ ] Supports: start, stop, pause, resume, reset
- [ ] Tracks elapsed time in milliseconds
- [ ] Emits events at configurable intervals
- [ ] Handles app backgrounding (calculates drift on resume)
- [ ] Unit tests cover all timer states

**Size:** M

**Tests to Write:**
```typescript
describe('useTimer', () => {
  it('should start from zero')
  it('should track elapsed time')
  it('should pause and resume')
  it('should reset to zero')
  it('should handle time drift when app backgrounds')
  it('should emit tick events at intervals')
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

**Status:** `pending`
**Depends On:** FOUND-001

**Story:** As a developer, I need card type definitions so that cards can be managed consistently.

**Acceptance Criteria:**
- [ ] TypeScript interfaces for: `Card`, `TimeBonusCard`, `PowerupCard`, `CurseCard`, `TimeTrapCard`
- [ ] All cards from rulebook catalogued
- [ ] Card effects documented in data
- [ ] **Time Bonus Cards:** Add minutes to hiding duration (values TBD from rulebook)
- [ ] **Powerup Cards:** Special abilities for hider (specific powerups TBD from rulebook)
- [ ] **Curse Cards:** Impose restrictions on seekers (specific curses TBD from rulebook)
- [ ] **Time Trap Cards (Expansion):** Designate station as trap, bonus if seekers visit

**Size:** M

**Notes:**
- Base game has 3 card types: Time Bonus, Powerup, Curse
- Time Trap is from expansion pack

---

### CARD-002: Create Card Store

**Status:** `pending`
**Depends On:** CARD-001, FOUND-008

**Story:** As a hider, I need to track my hand of cards so that I know what I can play.

**Acceptance Criteria:**
- [ ] Pinia store created: `cardStore`
- [ ] Hand limit enforced (default 6, expandable)
- [ ] `drawCards(count)` action adds random cards
- [ ] `playCard(cardId)` action removes card from hand
- [ ] `discardCard(cardId)` action removes without playing
- [ ] Store persists to localStorage

**Size:** M

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

## Epic 5: Game State

Overall game flow management.

---

### GS-001: Create Game Store

**Status:** `pending`
**Depends On:** FOUND-008

**Story:** As a player, I need game state tracked so that the app knows the current phase and active players.

**Acceptance Criteria:**
- [ ] Pinia store created: `gameStore`
- [ ] Tracks: current phase, current hider, round number, player list
- [ ] Phases: setup, hiding-period, seeking, end-game, round-complete
- [ ] `startRound(hiderId)` action initiates hiding period
- [ ] `endRound()` action records hider time and rotates
- [ ] Store persists to localStorage

**Size:** M

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
- Official Jet Lag logo palette: #1a1a2e (navy), #c73e3e (red), #f07d2e (orange), #f5b830 (gold), #00aaff (cyan)
- Proposed category colors in RESEARCH_NOTES.md (to be finalized)
- Prioritize accessibility and outdoor visibility

---

## Backlog Summary

| Epic | Stories | Complete | Remaining |
|------|---------|----------|-----------|
| 0: Project Foundation | 9 | 4 | 5 |
| 1: Question Tracking | 10 | 3 | 7 |
| 2: Timers | 4 | 0 | 4 |
| 3: Card Management | 7 | 0 | 7 |
| 4: Game State | 4 | 0 | 4 |
| 5: Mobile UX Polish | 4 | 0 | 4 |
| **Total** | **38** | **7** | **31** |

---

## Dependency Graph

Cards with no pending dependencies are **ready** to work on.

```
FOUND-001 (no deps) ─┬─→ FOUND-002 ─┬─→ FOUND-003 ─→ ...
                     │              ├─→ FOUND-005
                     │              ├─→ FOUND-008 ─→ Q-002c, GS-001
                     │              └─→ T-001 ─→ T-002, T-003, CARD-006b
                     ├─→ FOUND-004 ─┬─→ FOUND-006
                     │              └─→ UX-001
                     ├─→ FOUND-007
                     ├─→ UX-004
                     ├─→ Q-001 ─→ Q-001a ─→ Q-002a ─→ Q-002b ─→ Q-002c ─→ Q-005
                     │                              └─→ Q-003a ─→ Q-003b ─→ Q-004a ─→ Q-004b
                     └─→ CARD-001 ─┬─→ CARD-002 ─→ CARD-003, CARD-004, CARD-005
                                   └─→ CARD-006a ─→ CARD-006b
```

### Currently Ready (No Pending Dependencies)

With FOUND-001, FOUND-002, FOUND-003, FOUND-008, Q-001, Q-001a, and Q-002a complete, the following cards are now ready:
- **FOUND-004**: Configure Playwright for E2E Testing
- **FOUND-005**: Configure Pre-Commit Hooks
- **FOUND-007**: Configure PWA Support
- **T-001**: Create Timer Composable
- **Q-002b**: Question Store Actions (newly unblocked by Q-002a)
- **Q-003a**: Question List Display (newly unblocked by Q-002a)
- **CARD-001**: Define Card Data Model
- **UX-004**: Visual Design System
- **GS-001**: Create Game Store

**Note:** Q-002a completion unblocks Q-002b (Question Store Actions) and Q-003a (Question List Display), allowing parallel work on store logic and UI components.

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
