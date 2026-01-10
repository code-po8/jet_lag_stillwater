# Claude Code Instructions

This file provides context and instructions for Claude Code when working on this project.

## Project Overview

Mobile-friendly PWA for playing Jet Lag: Hide and Seek adapted for Stillwater, OK using the OSU bus system. See `RESEARCH_NOTES.md` for full game rules and design decisions.

## Tech Stack

- **Framework:** Vue 3 + TypeScript
- **State:** Pinia
- **Styling:** Tailwind CSS
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Build:** Vite
- **Deployment:** Netlify or Vercel (static files)

## Development Workflow: Ralph Wiggum Technique (Human-in-the-Loop)

This project uses a modified Ralph Wiggum technique with human checkpoints between iterations.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. ANALYZE                                             │
│     - Read STORIES.md for remaining cards               │
│     - Identify cards that are "ready" (dependencies met)│
│     - Select the optimal next card to work on           │
│     - Explain the selection reasoning                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. IMPLEMENT                                           │
│     - Follow TDD: write failing tests first             │
│     - Implement code to make tests pass                 │
│     - Ensure all acceptance criteria are met            │
│     - Run full test suite to prevent regressions        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. UPDATE                                              │
│     - Mark completed card in STORIES.md                 │
│     - Update any documentation if needed                │
│     - Commit changes with conventional commit message   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. STOP - HUMAN CHECKPOINT                             │
│     - Summarize what was completed                      │
│     - Report test results                               │
│     - Wait for human to review and approve              │
│     - Human decides whether to continue                 │
└─────────────────────────────────────────────────────────┘
                          ↓
            (Human approves, next iteration begins)
```

### Card Selection Criteria

When analyzing which card to work on next, consider:

1. **Dependencies:** Can this card be started? Are prerequisite cards complete?
2. **Foundation first:** Infrastructure/setup cards before feature cards
3. **Unblock others:** Prefer cards that unblock multiple other cards
4. **Test coverage:** Ensure testing infrastructure exists before feature tests
5. **Logical grouping:** Related cards may be more efficient together

Do NOT simply follow the order cards were added to STORIES.md.

### Card Size Guidelines

Cards should be small enough to:
- Complete in a single iteration without context overflow
- Have clear, testable acceptance criteria
- Result in a single logical commit

If a card feels too large during implementation, stop and discuss splitting it.

### TDD Workflow for Each Card

1. **Read** the acceptance criteria
2. **Write** failing tests that verify each criterion
3. **Run** tests to confirm they fail (red)
4. **Implement** minimal code to make tests pass
5. **Run** tests to confirm they pass (green)
6. **Refactor** if needed while keeping tests green
7. **Run** full test suite to catch regressions

### Commit Convention

```
type(scope): description

# Examples:
feat(questions): add question data model and types
test(timer): add unit tests for useTimer composable
chore(deps): configure vitest and vue test utils
```

### Files to Reference

| File | Purpose |
|------|---------|
| `RESEARCH_NOTES.md` | Game rules, tech decisions, UI design specs, icon reference |
| `GAME_RULES.md` | Official question formats, card costs, Stillwater adaptations |
| `STORIES.md` | Backlog of cards with acceptance criteria |
| `DEVELOPMENT.md` | Setup, scripts, deployment guide |
| `CLAUDE.md` | This file - workflow instructions |

### Starting an Iteration

When the human says to start or continue, Claude should:

1. Read `STORIES.md` to see current state
2. Identify which cards are complete vs remaining
3. Analyze remaining cards for optimal next selection
4. State which card will be worked on and why
5. Begin implementation following TDD

### Ending an Iteration

After completing a card, Claude should:

1. Summarize what was implemented
2. List tests that were added
3. Report test results (all passing?)
4. Show the commit that was created
5. **Update STORIES.md:**
   - Mark completed card as `complete`
   - Add any new dependencies discovered during implementation
   - Remove dependencies that proved unnecessary
   - Add new cards if scope was discovered
   - Split cards if one proved too large
   - Update the Backlog Summary counts
6. State what cards are now unblocked
7. **STOP and wait for human approval**

Do NOT automatically start the next card.

### Adjusting Stories During Implementation

The initial story backlog is a best guess. During implementation you may discover:

- **Missing dependencies:** A card needs something that wasn't anticipated → add the dependency
- **Unnecessary dependencies:** A card doesn't actually need a listed prerequisite → remove it
- **New cards needed:** Implementation reveals missing functionality → add new cards
- **Cards too large:** A card can't be completed in one iteration → split it into smaller cards
- **Cards should merge:** Two cards are so intertwined they should be one → combine them

Update STORIES.md immediately when these discoveries are made. The backlog is a living document.

## Project Structure

```
src/
├── components/
│   └── __tests__/
├── views/
├── stores/
│   └── __tests__/
├── services/
│   └── __tests__/
└── composables/
    └── __tests__/

tests/
├── integration/
└── e2e/
```

## Testing Commands

```bash
npm run test:unit           # Run unit tests
npm run test:unit:watch     # TDD mode
npm run test:e2e            # Run E2E tests
npm run lint                # Check code quality
```

## Important Notes

- Mobile-first design (test on 320px+ widths)
- PWA must work offline after initial load
- All game logic must match rules in RESEARCH_NOTES.md
- Persistence layer must be swappable (localStorage now, Supabase later)

## Security: Public Repository

This is a **public repository**. Never commit secrets or credentials.

**DO NOT commit:**
- API keys or tokens
- Database connection strings
- Private keys (*.pem, *.key)
- Credential files
- .env files (except .env.example with placeholder values)

**For environment variables:**
1. Create `.env.example` with placeholder values (committed)
2. Create `.env` with real values (gitignored)
3. Document required variables in DEVELOPMENT.md

**For CI/CD secrets:**
- Use GitHub repository secrets (Settings → Secrets and variables → Actions)
- Reference in workflows as `${{ secrets.SECRET_NAME }}`

**Supabase (future):**
- The `anon` key is designed to be public (client-side use)
- The `service_role` key must NEVER be committed or exposed
- Row-level security policies protect data, not the anon key
