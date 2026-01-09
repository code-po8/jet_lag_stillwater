# Jet Lag: The Game - Stillwater Edition Research Notes

## Project Context

**Goal:** Create a mobile-friendly web app for playing a modified version of Jet Lag: The Game (Hide and Seek Home Edition) adapted for Stillwater, OK.

**Adaptations for Stillwater:**
- Scaled down to Stillwater city limits (no robust regional transit)
- Using OSU bus system as the transit network
- User has created a custom Google Map with layers for:
  - Restaurants
  - Schools
  - Parks
  - OSU bus stops

**App Requirements (from user):**
- Track which questions have been asked
- Record the actual answers to those questions
- Show which questions are still available to ask and their costs
- Track how long the current hider has been hiding
- Mobile-friendly interface
- Reduce need to reference the physical rulebook
- Eliminate manual note-taking during gameplay

---

## Game Rules Summary

### Basic Gameplay Flow

1. One player (hider) uses public transit to reach a hiding spot during the hiding period
2. Other players (seekers) work together to find them by asking questions
3. Questions are chosen from 5 categories, each with different costs
4. Hider must answer truthfully within time limits
5. For each question answered, hider draws cards from their deck
6. Once hider is found, role passes to next player
7. Winner is the player who remained hidden the longest

### Player Requirements

- Minimum: 2 players
- Recommended maximum: 4 players
- Larger groups should form teams that act as a single player
- Teams recommended for younger players or safety concerns

---

## Game Size Categories

| Size | Area Type | Duration | Stations | Hiding Period | Hiding Zone Radius |
|------|-----------|----------|----------|---------------|-------------------|
| Small (S) | Single town | 4-8 hours | 30-100 | 30 minutes | 1/4 mile (400m) |
| Medium (M) | Major city | ~1 day | 100-500 | 60 minutes | 1/4 mile (400m) |
| Large (L) | Region/country | 2-4 days | 500+ | 180 minutes | 1/2 mile (800m) |

**For Stillwater:** Small (S) game size is appropriate.

---

## Question System

### Question Categories & Card Costs

The "cost" of asking a question is the cards the hider gets to draw and keep. More valuable information for seekers = more cards for hider.

| Category | Description | Draw | Keep |
|----------|-------------|------|------|
| Relative | Compares some element of the seekers to the hider | TBD | TBD |
| Radar | Checks if the hider is within a radius of the seekers | TBD | TBD |
| Photos | Requires the hider to send a photo of their choosing | TBD | TBD |
| Oddball | Requires hider to do something that may reveal incidental info | TBD | TBD |
| Precision | Lets seekers narrow down exactly where the hider is | TBD | TBD |

**Hand Limit:** Hider can hold up to 6 cards by default. Some powerup cards increase this limit.

### Timing Rules

- **Standard questions:** 5-minute response time
- **Photo questions:** 10 minutes (small/medium games), 20 minutes (large games)
- **One at a time:** Seekers must wait for the current question to be answered before asking another
- **Question repetition:** Questions cannot be re-asked unless seekers pay double cost

### Question Rules

- Seekers can ask at any time, as long as previous question has been answered
- Hider must answer each question truthfully
- Hider may use the internet to answer EXCEPT Google Street View and similar services
- Once seekers enter hiding zone, hider cannot fulfill Photo or Oddball requests

---

## Hider Deck & Card System

### Hand Management

- **Hand limit:** Up to 6 cards at once (expandable via powerups)
- Hider draws 1+ cards after answering each question (amount depends on category)

### Card Types

#### 1. Time Bonus Cards
- Add minutes to hiding duration when hider is found
- Only count if they are in hand at the end of the round
- Cannot be played, only discarded
- **Values:** 5, 10, or 15 minutes (lower values more common in deck)

#### 2. Powerup Cards

| Powerup | Effect |
|---------|--------|
| Veto | Decline a question; hider still receives cards for the question; seekers can re-ask the same question |
| Randomize | Replace question with random unasked question from same category |
| Lock (name TBD) | Locks out a specific question (details TBD) |
| Discard/Draw | Discard cards from hand and draw new ones |
| Draw 1, Expand | Draw a card + increase hand size by 1 |
| Duplicate | Copy another card; if kept, can copy any time bonus (doubling it) |
| Move | Establish new hiding zone; hiding timer pauses, seekers must stay put |

#### 3. Time Trap (Expansion Pack)
- Hider publicly designates a transit station as a trap
- If seekers visit the trapped station, hider gains bonus time
- Can be used as misdirection (trap a station far from hiding spot to mislead seekers)
- Seekers must decide: risk the trap or avoid it entirely

#### 4. Curse Cards
- Played by hider against seekers
- Impose conditions, challenges, or restrictions on seekers
- Many curses block question-asking until cleared
- **Restriction:** Never more than one curse blocking questions or transit at a time

**Curse Types:**

| Type | Description | Examples |
|------|-------------|----------|
| **Action-to-clear** | Seekers must perform a task to lift the curse | Find and attach a lemon to body, visit a museum, record a bird for X minutes |
| **Duration-based** | Active for a set time period | Movement restrictions for 30 minutes |
| **Until-found** | Active until hider is caught | Annoying item attached to seeker |
| **Dice-based** | Restrict movement using dice rolls | Roll for number of steps, roll for direction at intersections, roll to unlock doorways (evens unlock, odds = locked for 10 min) |

---

## Hiding Zone Rules

### Establishing the Zone
- Centered on a transit station (or street terminus for car/walking variants)
- Hider must remain within the zone for the rest of the round once established
- Zone is a circle with radius based on game size

### Hiding Spot Requirements
- Must be publicly accessible at all game times
- Must be within 10 feet of a marked path or road
- Fixed once end game starts
- Cannot be in bathrooms, homes, or suspicious locations

### End Game
- Triggered when seekers enter the hiding zone and leave transit
- Seekers must spot the hider AND be within 5 feet to win

---

## Map & Location Rules

### Map Legitimacy
- **Google Maps:** Places with 5+ reviews are legitimate (fewer = illegitimate unless agreed)
- **Other apps:** Any place is legitimate unless all players agree otherwise
- **Critical:** Hider and seekers MUST use the same maps app

### Location Sharing
Recommended tools:
- Apple Find My
- Google Maps sharing
- Telegram group location sharing
- WhatsApp live sharing

### Equipment Needed
- Online map tool (same for all players)
- Online hider deck (or physical cards)
- Live location sharing app
- 4 dice total (2 for hider, 2 for seekers)
- Optional: printed map of game area

---

## Special Rules

### Pausing
- Game can be paused if needed for safety/comfort
- When paused, ALL timers stop

### Rest Periods (Multi-day games)
- At least 10 hours rest required
- All players should return to same locations

### Photo Question Protection
- If seekers arrive in hiding zone within 10/20 minutes of photo being taken
- Hider can pause game to reposition
- Prevents seekers from using photo to trap hider

---

## Existing Community Resources

### Tools & Apps
- **Hide and Seek Map Generator:** https://taibeled.github.io/JetLagHideAndSeek/
- **Play Jet Lag (Unofficial):** https://www.playjetlag.com/ (iOS beta, Android coming)
- **Maps Hub:** maps.jetlag.games (user-created maps)
- **Jet Lag Companion:** Exports transit stations as KML files

### Community
- **Reddit:** r/JetLagTheGame
- **Discord:** discord.gg/jetlag
- **Wiki:** https://jetlag.fandom.com/wiki/Hide_%2B_Seek
- **GitHub:** https://github.com/jltg-community/awesome-jetlag-hide-and-seek

### Official Resources
- **Nebula Store:** store.nebula.tv/products/hideandseek
- **Expansion Pack Rules:** https://jetlagthegame.com/JLTG-Home-Game-Expansion-1-Rules.pdf
- **Rules Reference:** https://jetlag.denull.ru/en/rules/

---

## Stillwater-Specific Adaptations to Consider

1. **Transit System:** OSU bus routes instead of trains/metro
2. **Game Size:** Small (S) - appropriate for single town
3. **Hiding Period:** 30 minutes
4. **Hiding Zone:** 1/4 mile radius centered on bus stop
5. **Legitimate Locations:** User's custom Google Map layers define valid locations
6. **Question Modifications:** Some questions may need adaptation for bus-based transit

---

## Tech Stack Decisions

### Chosen Stack

| Layer | MVP (Phase 1) | Future (Phase 2+) |
|-------|---------------|-------------------|
| **Framework** | Vue.js 3 | Same |
| **State Management** | Pinia | Same (syncs with backend) |
| **Styling** | Tailwind CSS | Same |
| **Data Persistence** | localStorage | Supabase |
| **Real-time Sync** | — | Supabase Realtime |
| **Auth/Roles** | — | Supabase Auth |
| **GPS/Location** | Browser Geolocation API | Same + Supabase sync |
| **Hosting** | Netlify or Vercel (free) | Same |

### Why This Stack

**Vue.js 3** - Approachable learning curve, excellent documentation, good ecosystem.

**Pinia** - Vue's official state manager. Creates clean separation between UI and data persistence, making it easy to swap localStorage for Supabase later without rewriting components.

**Tailwind CSS** - Mobile-first utility classes, rapid prototyping, consistent design.

**PWA (Progressive Web App)** - A regular website that behaves like a native app:
- "Install" to home screen (no app store needed)
- Offline support via service workers (works when cell signal drops during gameplay)
- Full-screen mode (hides browser chrome, feels native)
- HTTPS required (provided free by Netlify/Vercel)

**Supabase (Future)** - Ideal for multiplayer sync:
- Real-time subscriptions for instant state updates
- Row-level security for role-based data access
- Built-in auth for player accounts
- PostgreSQL database
- Generous free tier (500MB database, 50K monthly users)

### Testing Stack

| Test Type | Tool | Purpose |
|-----------|------|---------|
| **Unit** | Vitest + Vue Test Utils | Test individual functions, components in isolation |
| **Integration** | Vitest + Testing Library | Test component interactions, store logic |
| **E2E / Browser** | Playwright | Real browser testing, user flows |
| **Pre-commit** | Husky + lint-staged | Run linting and unit tests before commits |
| **CI/CD** | GitHub Actions | Run full test suite on push/PR |

**Testing Philosophy:** Test-driven development (TDD) preferred. Write failing tests first, then implement to make them pass. Full test suite must pass before merging.

### Project Structure

```
src/
├── components/
│   └── __tests__/        # Component unit tests
├── views/                # Pages (HiderView, SeekerView, Lobby)
├── stores/
│   └── __tests__/        # Store unit tests
│   ├── gameStore.js
│   ├── questionStore.js
│   ├── cardStore.js
│   └── playerStore.js
├── services/
│   └── __tests__/        # Service unit tests
│   └── persistence.js
└── composables/
    └── __tests__/        # Composable unit tests

tests/
├── integration/          # Cross-component integration tests
└── e2e/                  # Playwright browser tests

.github/
└── workflows/
    └── ci.yml            # GitHub Actions workflow

vitest.config.js          # Unit/integration test config
playwright.config.js      # E2E test config
```

### Source Control & CI/CD

- **Repository:** GitHub (personal free account)
- **Project Management:** GitHub Projects (kanban board)
- **Branch Strategy:** Feature branches → PR → main
- **CI Pipeline:** GitHub Actions
  - Runs on: push to main, all PRs
  - Steps: lint → unit tests → integration tests → E2E tests
  - Deploy only on green builds

### Environment Setup Summary

**Local Development:** Install Node.js (via nvm recommended), then `npm install` handles everything else.

**GitHub CI:** Node.js pre-installed on runners. Workflow runs `npm ci` to install dependencies.

**Production (Netlify/Vercel):** Only static files deployed (HTML/CSS/JS). No Node.js needed at runtime. Test frameworks are devDependencies and are NOT included in production builds.

See `DEVELOPMENT.md` for complete setup instructions, npm scripts reference, and troubleshooting guide.

---

## Implementation Phases

### Phase 1: MVP (Single-Device, Client-Side)

Core functionality for testing with family:

- [ ] Project scaffolding (Vue 3 + Pinia + Tailwind + PWA)
- [ ] Question tracker (asked/available per category)
- [ ] Answer history with timestamps
- [ ] Question response timer (5-min or 10-min for photos)
- [ ] Hiding timer (time elapsed since hiding period ended)
- [ ] Card draw/keep tracker (triggered by questions)
- [ ] Hider card hand display (up to 6 cards)
- [ ] Card draw simulation
- [ ] Time bonus calculator
- [ ] Powerup/curse tracking
- [ ] Game phase indicator (hiding period, seeking, end game)
- [ ] Mobile-first responsive UI
- [ ] PWA manifest and service worker (offline support, installable)
- [ ] localStorage persistence

### Phase 2: Multi-Player Sync

Real-time sync between players:

- [ ] Supabase integration (database + auth)
- [ ] Player accounts and game session codes
- [ ] Role assignment (hider vs seekers)
- [ ] Real-time state sync across devices
- [ ] Role-based views and permissions
- [ ] Shared timer synchronized across all players

### Phase 3: GPS & Location Features

- [ ] Seeker GPS location tracking (visible to hider only)
- [ ] Hider GPS hidden from seekers (enforced at database level)
- [ ] Proximity alerts
- [ ] Integration with OSU bus stop locations

### Future Role-Based Features

```
Game Session
├── Hider (1 player)
│   ├── Can see: seeker GPS, their cards, shared timer
│   ├── Can do: play cards, answer questions
│   └── Cannot see: (nothing restricted)
│
└── Seekers (other players)
    ├── Can see: question history, answers, shared timer
    ├── Can do: ask questions
    └── Cannot see: hider GPS, hider's cards
```

Row-level security in Supabase will enforce these permissions at the database level.

---

## Next Steps

1. ~~Decide on tech stack~~ **DONE** (Vue 3 + Pinia + Tailwind + PWA)
2. Scaffold project structure
3. Design mobile-first UI/UX
4. Implement core question tracking
5. Add timer functionality
6. Build card management system
7. Add PWA features (manifest, service worker)
8. Test with family gameplay
9. Iterate based on feedback
10. (Future) Add Supabase for multiplayer sync

---

## Visual Design Research

### Official Branding

**Logo Design:** Pentagon/shield shape with airplane silhouette, radiating "sunset" gradient stripes, cyan glow effect.

**Primary Color Palette (from logo):**

| Color | Hex (approx) | Usage |
|-------|--------------|-------|
| Dark Navy | #1a1a2e | Background, airplane silhouette |
| Deep Red | #c73e3e | Inner gradient stripe |
| Vibrant Orange | #f07d2e | Middle gradient stripe |
| Golden Yellow | #f5b830 | Outer gradient stripe |
| Cyan Glow | #00aaff | Radiating light effect, accents |

**Typography:** "JET LAG" in bold caps, "THE GAME" in smaller text below. Font appears to be a bold sans-serif (Poppins or similar).

### Question Category Colors (Not Official)

The official game does not publish color codes for question categories. Community tools create their own palettes. Recommended approach: Design our own distinctive colors for each category that are:
- Accessible (good contrast)
- Distinguishable from each other
- Mobile-friendly (visible in bright outdoor light)

**Suggested Category Palette (to be finalized):**

Using the official branding palette as inspiration, here's a proposed scheme:

| Category | Hex | Rationale |
|----------|-----|-----------|
| Relative | #f5b830 (Gold) | Comparison/balance feels "golden" |
| Radar | #00aaff (Cyan) | Tech/scanning vibe, matches glow |
| Photos | #f07d2e (Orange) | Warm, creative, visible |
| Oddball | #9b59b6 (Purple) | Unusual/quirky stands out |
| Precision | #c73e3e (Red) | Precise/urgent, high-stakes feel |

These colors:
- Derive from the official Jet Lag palette (plus purple for contrast)
- Are distinct from each other at a glance
- Work on dark backgrounds
- Should be tested for WCAG AA compliance

### Community Inspiration

- **butlerx.github.io/jetlag:** WebAssembly app with custom SCSS styling; uses official Jet Lag logo
- **taibeled.github.io/JetLagHideAndSeek:** Map generator with its own UI
- **jetlag.denull.ru:** Rules reference with minimal styling

### Design Principles for Stillwater App

1. **Mobile-first:** Large touch targets, readable in outdoor sunlight
2. **Quick glance:** Key info (timers, hand count) visible without scrolling
3. **Category recognition:** Distinct colors for fast question filtering
4. **Minimal chrome:** Maximize content area for gameplay
5. **Accessibility:** Meet WCAG 2.1 AA contrast standards

---

*Research compiled: January 2026*
*Last updated: January 2026*
*Sources: Jet Lag Wiki, official rules PDFs, community resources, Nebula store*
