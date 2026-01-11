# Project History & Process Documentation

This document captures the process, decisions, and evolution of building the Jet Lag Stillwater app. It serves as a reference for future projects using similar workflows.

---

## Project Genesis

### Initial Vision
The goal was to create a **mobile-friendly PWA** for playing Jet Lag: Hide and Seek (from the Nebula/YouTube series) adapted specifically for **Stillwater, Oklahoma** using the **OSU bus system** as the transit network.

### Key Requirements Identified
- Must work on mobile devices during active gameplay
- Needs to function offline after initial load (PWA)
- Should track questions, timers, cards, and game state
- Must support both hider and seeker roles
- Single-device play supported (passing phone between players)
- Persistence so game state survives app closures

---

## Technology Stack Decision

### Discussion Process
We evaluated options considering:
- Mobile-first requirements
- PWA capabilities
- Developer experience and tooling
- Testing ecosystem
- Future extensibility (potential Supabase backend)

### Final Stack Selection
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Vue 3** | Excellent PWA support, reactive, good mobile performance |
| Language | **TypeScript** | Type safety for complex game logic |
| State | **Pinia** | Official Vue state management, simple API |
| Styling | **Tailwind CSS** | Rapid prototyping, mobile-first utilities |
| Build | **Vite** | Fast dev server, optimized production builds |
| Unit Tests | **Vitest** | Native Vite integration, fast, Jest-compatible |
| Integration | **Testing Library** | User-centric testing approach |
| E2E Tests | **Playwright** | Cross-browser, reliable |

---

## Development Methodology

### Test-Driven Development (TDD)
We committed to strict TDD:
1. Write failing tests first (based on acceptance criteria)
2. Implement minimal code to make tests pass
3. Refactor while keeping tests green
4. Run full test suite to catch regressions

### Story-Based Backlog
All work organized into stories with:
- **Acceptance Criteria** that map directly to test cases
- **Dependencies** explicitly tracked between stories
- **Size estimates** (S/M/L) to keep stories appropriately scoped
- **Status tracking** (pending → in-progress → complete)

Stories documented in `STORIES.md` with a dependency graph showing what can be worked on at any time.

---

## The Ralph Wiggum Technique

### Concept
A **human-in-the-loop autonomous workflow** where Claude Code runs semi-autonomously to complete story cards, with mandatory human checkpoints between iterations.

### Workflow
```
┌─────────────────────────────────────────────────────────┐
│  1. ANALYZE                                             │
│     - Read STORIES.md for remaining cards               │
│     - Identify cards that are "ready" (dependencies met)│
│     - Select optimal next card based on criteria        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. IMPLEMENT                                           │
│     - Follow TDD: write failing tests first             │
│     - Implement code to make tests pass                 │
│     - Run full test suite                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. UPDATE                                              │
│     - Mark completed card in STORIES.md                 │
│     - Update dependencies and backlog counts            │
│     - Commit changes                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. STOP - HUMAN CHECKPOINT                             │
│     - Summarize what was completed                      │
│     - Wait for human review and approval                │
│     - Human decides whether to continue                 │
└─────────────────────────────────────────────────────────┘
```

### Implementation: ralph.sh
A shell script launches Claude Code with:
- Pre-approved tools (Edit, Write, npm commands, git commands)
- A structured prompt with card selection criteria
- Instructions to follow CLAUDE.md workflow

### Card Selection Criteria (Evolved Over Time)
1. **UI visibility preference** - Prioritize cards that make the app viewable in browser (added later to enable early feedback)
2. **Unblocking potential** - Prefer cards that unblock multiple other cards
3. **Logical grouping** - Related cards may be efficient together
4. **Foundation first** - But don't let infrastructure block UI indefinitely

### Lessons Learned
- **Permission management**: Needed to add `--allowedTools` for various commands (npm install, mkdir, etc.) as they were discovered
- **Co-author attribution**: Had to explicitly instruct not to add Co-Authored-By lines to commits
- **Prompt structure**: Putting critical rules at the top of the prompt is more effective
- **UI visibility**: Added preference for UI-visible stories so progress could be validated early

---

## Documentation Strategy

### Documentation-First Approach
Before writing code, we created comprehensive documentation:

| File | Purpose |
|------|---------|
| `GAME_RULES.md` | Complete game rules from official rulebook, Stillwater adaptations, full card deck |
| `RESEARCH_NOTES.md` | UI design specs, colors from show, technical decisions |
| `STORIES.md` | Full backlog with acceptance criteria and dependencies |
| `CLAUDE.md` | Workflow instructions for Claude Code / Ralph Wiggum |
| `DEVELOPMENT.md` | Setup, scripts, deployment guide |

### Benefits
- Claude Code has full context for each iteration
- Rules and requirements are authoritative sources
- Human can review/update docs between iterations
- New contributors (human or AI) can onboard quickly

---

## Game Rules Research

### Source Material
- Official Jet Lag: Hide and Seek rulebook
- Screenshots from Nebula episodes for UI reference
- OSU bus route information for Stillwater adaptation

### Key Adaptations for Stillwater
- **Game Size**: Small (appropriate for Stillwater area)
- **Transit System**: OSU bus routes
- **Hiding Period**: 30 minutes
- **Hiding Zone Radius**: 1/4 mile centered on bus stop
- **Custom Questions**: Added Stillwater-specific questions (quadrants, local landmarks)

### UI Design Research
Captured from Nebula show screenshots:
- Category colors (Matching=#1e3a5f navy, Measuring=#2d8a4e green, etc.)
- Icon descriptions for each question category
- Question menu layout and interaction patterns

---

## Card/Deck Documentation

### Process
The user provided complete hider deck contents which were documented in GAME_RULES.md:
- **55 Time Bonus cards** (5 tiers with game-size-specific values)
- **21 Powerup cards** (7 types with quantities)
- **24 Curse cards** (unique effects with casting costs)
- **Total: 100 cards**

This detailed data was then implemented in `src/types/card.ts` with full TypeScript types.

---

## GitHub Integration

### Setup
- Repository created as public (open source)
- SSH configured with custom host alias (`github-code-po8`) for specific SSH key
- No CI/CD configured yet (story FOUND-006 pending)

### Security Considerations
- Never commit secrets (documented in CLAUDE.md)
- Supabase `anon` key is designed to be public; `service_role` key must never be exposed
- `.env.example` with placeholders committed; `.env` with real values gitignored

---

## Current Project State

### Completed Infrastructure
- Vue 3 + TypeScript + Tailwind project scaffold
- Vitest + Testing Library configured
- Persistence service abstraction (localStorage, swappable to Supabase)

### Completed Features (Backend)
- Question data model and 83 seeded questions
- Question store with ask/answer/veto actions
- Card data model and 100-card deck
- Card store with draw/play/discard actions
- Game store with phases and player management
- Timer composable

### Pending for Viewable App
- Game Setup Flow (UI)
- Role-Based Views (UI)
- Navigation structure

### Test Coverage
- 313 unit tests passing
- Lint and type-check passing

---

## Key Insights for Future Projects

1. **Document rules/requirements thoroughly before coding** - Saves significant back-and-forth

2. **Ralph Wiggum works well for well-defined tasks** - Clear acceptance criteria and dependencies are essential

3. **Human checkpoints catch direction issues early** - Don't let it run too long unsupervised

4. **Prioritize UI visibility** - Being able to see the app helps validate direction

5. **Stories should be small enough for one iteration** - If a story is too big, split it

6. **Keep the backlog living** - Discover missing stories, split large ones, update dependencies as you learn

7. **TDD provides confidence** - Refactoring card types was safe because tests caught issues

8. **Prompt engineering matters** - Put critical rules prominently, be explicit about what NOT to do

---

## Reusable Project Setup Wizard

Use this checklist when starting a new project with the Ralph Wiggum technique.

### Phase 1: Vision & Requirements (Human-Driven)

- [ ] **Define the product vision**
  - What problem does this solve?
  - Who is the target user?
  - What are the core features (MVP)?
  - What platforms/devices must it support?

- [ ] **Document domain knowledge**
  - What are the rules/logic of the domain?
  - Are there official sources (rulebooks, specs, APIs)?
  - What terminology is used?
  - Create a `DOMAIN_RULES.md` or similar with authoritative information

- [ ] **Identify constraints**
  - Offline requirements?
  - Performance requirements?
  - Security considerations?
  - Budget/timeline constraints?

### Phase 2: Tech Stack Selection (Human + Claude Discussion)

- [ ] **Discuss options with Claude**
  - Describe your requirements and constraints
  - Ask for tech stack recommendations with trade-offs
  - Consider: framework, language, state management, styling, testing, build tools

- [ ] **Make decisions and document them**
  - Create a `RESEARCH_NOTES.md` or `TECH_DECISIONS.md`
  - Record WHY each choice was made (helps future you)

- [ ] **Decide on development methodology**
  - TDD recommended for Ralph Wiggum (provides safety net)
  - Story-based backlog with acceptance criteria
  - Human-in-the-loop checkpoints

### Phase 3: Project Scaffold (Claude-Assisted)

- [ ] **Create the project**
  - Use appropriate scaffolding tool (create-vue, create-next-app, etc.)
  - Configure TypeScript if using
  - Set up styling framework
  - Verify `npm run dev` and `npm run build` work

- [ ] **Configure testing**
  - Unit test framework (Vitest, Jest, etc.)
  - Integration test library (Testing Library)
  - E2E framework (Playwright, Cypress) - can defer if not critical path
  - Verify a sample test passes

- [ ] **Set up linting/formatting**
  - ESLint with appropriate plugins
  - Prettier (optional but recommended)
  - Verify `npm run lint` works

- [ ] **Initialize git repository**
  - Create `.gitignore` (node_modules, .env, dist, etc.)
  - Initial commit with scaffold

### Phase 4: Documentation Setup (Human + Claude)

- [ ] **Create CLAUDE.md** (workflow instructions)
  ```markdown
  # Claude Code Instructions

  ## Project Overview
  [Brief description of what this project is]

  ## Tech Stack
  [List the stack with brief rationale]

  ## Development Workflow
  [Describe TDD approach, Ralph Wiggum technique]

  ## Files to Reference
  | File | Purpose |
  |------|---------|
  | STORIES.md | Backlog with acceptance criteria |
  | [DOMAIN].md | Domain rules and requirements |
  | ... | ... |

  ## Testing Commands
  [npm run test:unit, etc.]

  ## Important Notes
  [Mobile-first? Offline? Security considerations?]
  ```

- [ ] **Create STORIES.md** (backlog)
  - Define story format (ID, status, depends on, acceptance criteria, size)
  - Create Epic 0: Project Foundation stories
  - Create feature epics with initial stories
  - Build dependency graph
  - Mark "Currently Ready" stories

- [ ] **Create domain documentation**
  - `GAME_RULES.md`, `API_SPEC.md`, `BUSINESS_RULES.md`, etc.
  - Be thorough - Claude will reference this constantly
  - Include examples where helpful

- [ ] **Create DEVELOPMENT.md**
  - How to set up local dev environment
  - Available npm scripts
  - Environment variables needed
  - Deployment instructions (can be placeholder initially)

### Phase 5: Initial Story Backlog (Human + Claude)

- [ ] **Brainstorm all features needed for MVP**
  - Don't worry about order yet
  - Include infrastructure (testing, CI, PWA, etc.)
  - Include UI/UX stories

- [ ] **Break features into small stories**
  - Each story should be completable in one Ralph iteration
  - Clear acceptance criteria that become tests
  - Size: S (<2hrs), M (2-4hrs), L (4-8hrs), XL (break it down)

- [ ] **Map dependencies**
  - Which stories must complete before others can start?
  - Identify foundation stories vs feature stories
  - Create visual dependency graph in STORIES.md

- [ ] **Identify "ready" stories**
  - Stories with no pending dependencies
  - Mark these clearly in STORIES.md

- [ ] **Prioritize UI visibility**
  - Ensure path to viewable app isn't blocked by too much infrastructure
  - You want to see progress early to validate direction

### Phase 6: Ralph Wiggum Setup

- [ ] **Create ralph.sh**
  ```bash
  #!/bin/bash
  cd "$(dirname "$0")"

  claude \
    --allowedTools "Edit" \
    --allowedTools "Write" \
    --allowedTools "Bash(npm install*)" \
    --allowedTools "Bash(npm run *)" \
    --allowedTools "Bash(npx vitest*)" \
    --allowedTools "Bash(git add*)" \
    --allowedTools "Bash(git commit*)" \
    --allowedTools "Bash(git status*)" \
    --allowedTools "Bash(git diff*)" \
    --allowedTools "Bash(git log*)" \
    --allowedTools "Bash(mkdir*)" \
    -- "Start a Ralph Wiggum iteration.

  CRITICAL RULE: When committing, NEVER add Co-Authored-By lines.

  FIRST: Run the full test suite (lint, type-check, unit tests) before doing anything else. If any tests fail, fix them before proceeding. You own the codebase as it exists now - do not blame previous iterations.

  Read CLAUDE.md for workflow instructions, then read STORIES.md to analyze the backlog.

  Card selection criteria:
  1. UI visibility preference: Prioritize cards that make the app viewable/usable in browser
  2. Which unblocks the most other cards
  3. Logical grouping with recent work
  4. Foundation-before-features (but don't block UI indefinitely)
  Explain your selection reasoning.

  Implementation: Follow TDD as described in CLAUDE.md.

  After completing: Update STORIES.md, commit changes, then STOP and wait for human approval."
  ```

- [ ] **Make ralph.sh executable**
  ```bash
  chmod +x ralph.sh
  ```

- [ ] **Test ralph.sh**
  - Run it once
  - Watch for permission prompts (add to --allowedTools as needed)
  - Verify it selects a sensible first story
  - Let it complete one iteration
  - Review the work

### Phase 7: GitHub Setup (Optional but Recommended)

- [ ] **Create GitHub repository**
  - Public or private based on your needs
  - Don't commit secrets to public repos

- [ ] **Configure SSH if needed**
  - Custom host alias for multiple GitHub accounts
  - Add to ~/.ssh/config

- [ ] **Push initial commit**
  ```bash
  git remote add origin git@github.com:user/repo.git
  git push -u origin main
  ```

- [ ] **Set up branch protection** (optional)
  - Require PR reviews
  - Require CI to pass (once CI is set up)

### Phase 8: First Iterations

- [ ] **Run 2-3 Ralph iterations with close supervision**
  - Watch for issues with the workflow
  - Adjust ralph.sh prompt as needed
  - Update STORIES.md if stories are wrong-sized

- [ ] **Review and course-correct**
  - Is the code quality acceptable?
  - Is it following TDD properly?
  - Are stories appropriately sized?
  - Is progress toward viewable app happening?

- [ ] **Run the app** (once UI stories complete)
  - Does it look/feel right?
  - Any major direction changes needed?
  - Better to catch early than after 20 iterations

---

## Quick Reference: Files to Create

```
project/
├── CLAUDE.md           # Workflow instructions for Claude
├── STORIES.md          # Backlog with acceptance criteria
├── [DOMAIN].md         # Domain rules (GAME_RULES.md, API_SPEC.md, etc.)
├── RESEARCH_NOTES.md   # Tech decisions, UI research, design notes
├── DEVELOPMENT.md      # Setup and deployment guide
├── ralph.sh            # Ralph Wiggum launcher script
├── .gitignore          # Standard ignores
├── .env.example        # Environment variable template (no secrets)
└── src/                # Application code
```

---

## Quick Reference: Ralph Wiggum --allowedTools

Common tools to pre-approve (adjust based on your stack):

```bash
--allowedTools "Edit"
--allowedTools "Write"
--allowedTools "Bash(npm install*)"
--allowedTools "Bash(npm run *)"
--allowedTools "Bash(npx vitest*)"
--allowedTools "Bash(npx playwright*)"
--allowedTools "Bash(npx jest*)"
--allowedTools "Bash(git add*)"
--allowedTools "Bash(git commit*)"
--allowedTools "Bash(git status*)"
--allowedTools "Bash(git diff*)"
--allowedTools "Bash(git log*)"
--allowedTools "Bash(mkdir*)"
```

Add more as needed when you see permission prompts during iterations.

---

*Document created: January 2026*
