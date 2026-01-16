<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// Track which sections are expanded
const expandedSections = ref<Record<string, boolean>>({
  'hiding-period': false,
  'card-hand': false,
  powerups: false,
  curses: false,
  'time-bonus': false,
  'time-traps': false,
  questions: false,
  move: false,
  standalone: false,
})

function toggleSection(sectionId: string) {
  expandedSections.value[sectionId] = !expandedSections.value[sectionId]
}
</script>

<template>
  <div
    v-if="isOpen"
    data-testid="hider-guide-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="hider-guide-title"
    class="hider-guide-overlay"
  >
    <div
      data-testid="hider-guide-overlay"
      class="hider-guide-overlay-bg"
      @click="emit('close')"
    ></div>

    <div data-testid="hider-guide-content" class="hider-guide-content" @click.stop>
      <!-- Header -->
      <div class="hider-guide-header">
        <h2 id="hider-guide-title" class="hider-guide-title">Hider Guide</h2>
        <button
          data-testid="hider-guide-close-btn"
          class="hider-guide-close-btn"
          aria-label="Close guide"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="hider-guide-body">
        <!-- Hiding Period Section -->
        <section
          data-testid="guide-section-hiding-period"
          class="guide-section"
          :data-expanded="expandedSections['hiding-period']"
        >
          <button
            data-testid="guide-section-hiding-period-header"
            class="guide-section-header"
            @click="toggleSection('hiding-period')"
          >
            <span class="guide-section-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Hiding Period</span>
            <span
              class="guide-section-chevron"
              :class="{ expanded: expandedSections['hiding-period'] }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['hiding-period']" class="guide-section-content">
            <p>
              The hiding period gives you <strong>30 minutes to hide</strong> somewhere within the
              game boundaries. During this time:
            </p>
            <ul>
              <li>Travel to your chosen hiding spot</li>
              <li>Seekers cannot move or ask questions</li>
              <li>Plan your strategy based on your cards</li>
            </ul>
            <p>The timer counts down - when it reaches zero, the seeking phase begins!</p>
          </div>
        </section>

        <!-- Card Hand Section -->
        <section
          data-testid="guide-section-card-hand"
          class="guide-section"
          :data-expanded="expandedSections['card-hand']"
        >
          <button
            data-testid="guide-section-card-hand-header"
            class="guide-section-header"
            @click="toggleSection('card-hand')"
          >
            <span class="guide-section-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M21.47 4.35l-1.34-.56v9.03l2.43-5.86c.41-1.02-.06-2.19-1.09-2.61zm-19.5 3.7L6.93 20a2.01 2.01 0 001.81 1.26c.26 0 .53-.05.79-.16l7.37-3.05c.75-.31 1.21-1.05 1.23-1.79.01-.26-.04-.55-.13-.81L13 3.5c-.29-.72-.97-1.17-1.73-1.17-.27 0-.54.05-.79.15L3.11 5.54c-1.03.42-1.51 1.6-1.14 2.51z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Your Cards</span>
            <span
              class="guide-section-chevron"
              :class="{ expanded: expandedSections['card-hand'] }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['card-hand']" class="guide-section-content">
            <p>Your hand contains cards of four types:</p>
            <ul>
              <li>
                <strong class="text-green-400">Time Bonus</strong> - Add extra minutes to your
                hiding time when caught
              </li>
              <li>
                <strong class="text-cyan-400">Powerup</strong> - Special abilities to help you
                survive longer
              </li>
              <li>
                <strong class="text-purple-400">Curse</strong> - Restrictions you can place on
                seekers
              </li>
              <li>
                <strong class="text-orange-400">Time Trap</strong> - Hidden surprises for seekers
              </li>
            </ul>
            <p>Tap a card to view its details and play it when appropriate.</p>
          </div>
        </section>

        <!-- Powerup Cards Section -->
        <section
          data-testid="guide-section-powerups"
          class="guide-section"
          :data-expanded="expandedSections.powerups"
        >
          <button
            data-testid="guide-section-powerups-header"
            class="guide-section-header"
            @click="toggleSection('powerups')"
          >
            <span class="guide-section-icon text-cyan-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Powerup Cards</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.powerups }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.powerups" class="guide-section-content">
            <p>Powerups give you special abilities:</p>
            <ul>
              <li><strong>Discard 1, Draw 2</strong> - Exchange a card for two new ones</li>
              <li><strong>Discard 2, Draw 3</strong> - Exchange two cards for three new ones</li>
              <li>
                <strong>Draw 1, Expand</strong> - Draw a card and increase your hand limit by 1
              </li>
              <li><strong>Duplicate</strong> - Copy any card in your hand</li>
              <li><strong>Move</strong> - Relocate to a new hiding spot (see Move section)</li>
            </ul>
            <p>Play powerups strategically to maximize your advantage!</p>
          </div>
        </section>

        <!-- Curse Cards Section -->
        <section
          data-testid="guide-section-curses"
          class="guide-section"
          :data-expanded="expandedSections.curses"
        >
          <button
            data-testid="guide-section-curses-header"
            class="guide-section-header"
            @click="toggleSection('curses')"
          >
            <span class="guide-section-icon text-purple-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Curse Cards</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.curses }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.curses" class="guide-section-content">
            <p>
              Curses restrict what seekers can do. When you play a curse, all seekers must follow
              its rules for the curse's duration.
            </p>
            <p>Examples of curse effects:</p>
            <ul>
              <li>Cannot use certain transportation</li>
              <li>Cannot ask certain question types</li>
              <li>Must travel in specific ways</li>
            </ul>
            <p>Play curses at strategic moments to slow down seekers when they're getting close!</p>
          </div>
        </section>

        <!-- Time Bonus Section -->
        <section
          data-testid="guide-section-time-bonus"
          class="guide-section"
          :data-expanded="expandedSections['time-bonus']"
        >
          <button
            data-testid="guide-section-time-bonus-header"
            class="guide-section-header"
            @click="toggleSection('time-bonus')"
          >
            <span class="guide-section-icon text-green-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </span>
            <span class="guide-section-title">Time Bonus</span>
            <span
              class="guide-section-chevron"
              :class="{ expanded: expandedSections['time-bonus'] }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['time-bonus']" class="guide-section-content">
            <p>
              Time Bonus cards add extra minutes to your total hiding time. The bonus is
              automatically applied when the game ends.
            </p>
            <p>
              Keep time bonus cards in your hand - they don't need to be played! Their value is
              added to your final time automatically.
            </p>
            <p>
              Higher tier cards add more time. Check the "Total Time Bonus" display to see how much
              extra time you've accumulated.
            </p>
          </div>
        </section>

        <!-- Time Trap Section -->
        <section
          data-testid="guide-section-time-traps"
          class="guide-section"
          :data-expanded="expandedSections['time-traps']"
        >
          <button
            data-testid="guide-section-time-traps-header"
            class="guide-section-header"
            @click="toggleSection('time-traps')"
          >
            <span class="guide-section-icon text-orange-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </span>
            <span class="guide-section-title">Time Traps</span>
            <span
              class="guide-section-chevron"
              :class="{ expanded: expandedSections['time-traps'] }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['time-traps']" class="guide-section-content">
            <p>Time Traps are hidden surprises you can set for seekers.</p>
            <p>How to use:</p>
            <ul>
              <li>Play a Time Trap card and name a location or zone</li>
              <li>The trap is now "set" at that location</li>
              <li>If a seeker enters that zone, the trap triggers!</li>
              <li>Triggered traps add bonus time for you</li>
            </ul>
            <p>
              Set traps in locations you think seekers will search, but not where you're actually
              hiding!
            </p>
          </div>
        </section>

        <!-- Answering Questions Section -->
        <section
          data-testid="guide-section-questions"
          class="guide-section"
          :data-expanded="expandedSections.questions"
        >
          <button
            data-testid="guide-section-questions-header"
            class="guide-section-header"
            @click="toggleSection('questions')"
          >
            <span class="guide-section-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Answering Questions</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.questions }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.questions" class="guide-section-content">
            <p>When seekers ask you a question, you must answer honestly within the time limit.</p>
            <p>Your options:</p>
            <ul>
              <li><strong>Answer</strong> - Respond truthfully to the question</li>
              <li>
                <strong>Veto</strong> - Refuse to answer (you still get cards, but seekers don't
                learn anything)
              </li>
            </ul>
            <p>
              Veto is powerful but limited! Use it when a question would reveal your exact location.
            </p>
            <p>
              Some question types have specific answer formats - make sure you understand what's
              being asked before responding.
            </p>
          </div>
        </section>

        <!-- Move Powerup Section -->
        <section
          data-testid="guide-section-move"
          class="guide-section"
          :data-expanded="expandedSections.move"
        >
          <button
            data-testid="guide-section-move-header"
            class="guide-section-header"
            @click="toggleSection('move')"
          >
            <span class="guide-section-icon text-amber-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </span>
            <span class="guide-section-title">Move Powerup</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.move }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.move" class="guide-section-content">
            <p>
              The Move powerup lets you relocate to a new hiding zone! This is your escape card when
              seekers get too close.
            </p>
            <p>When you play Move:</p>
            <ul>
              <li>Your hiding timer pauses</li>
              <li>Seekers are frozen and cannot move</li>
              <li>You discard your entire hand</li>
              <li>Travel to your new hiding spot</li>
              <li>Confirm your new zone to resume the game</li>
            </ul>
            <p>
              <strong>Warning:</strong> Move can only be used during the seeking phase, not during
              end-game when seekers are in your zone!
            </p>
          </div>
        </section>

        <!-- Standalone Mode Section -->
        <section
          data-testid="guide-section-standalone"
          class="guide-section"
          :data-expanded="expandedSections.standalone"
        >
          <button
            data-testid="guide-section-standalone-header"
            class="guide-section-header"
            @click="toggleSection('standalone')"
          >
            <span class="guide-section-icon text-slate-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Standalone Mode</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.standalone }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.standalone" class="guide-section-content">
            <p>
              <strong>Standalone mode</strong> lets hiders and seekers use the app on separate
              devices independently, without automatic synchronization.
            </p>
            <p><strong>Hider Device Setup:</strong></p>
            <ul>
              <li>Use "Add Card" to manually add cards from your physical deck</li>
              <li>Track your time bonuses, powerups, and curses in the app</li>
              <li>Play cards by selecting them from your hand</li>
            </ul>
            <p><strong>What You Must Announce to Seekers:</strong></p>
            <ul>
              <li>
                <strong>Curses:</strong> When you play a curse, tell seekers the curse name so they
                can activate it on their devices
              </li>
              <li>
                <strong>Time Traps:</strong> When you set a time trap, announce the station/zone
                name publicly
              </li>
              <li>
                <strong>Question Answers:</strong> Communicate your answers verbally or via text
                message
              </li>
              <li>
                <strong>Veto/Randomize:</strong> Tell seekers if you veto or randomize a question
              </li>
            </ul>
            <p><strong>Game End:</strong></p>
            <ul>
              <li>When found, announce your final time bonuses to calculate your score</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hider-guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.hider-guide-overlay-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.hider-guide-content {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.hider-guide-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.15) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.hider-guide-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%);
}

.hider-guide-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  color: var(--color-role-hider);
}

.hider-guide-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.hider-guide-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hider-guide-close-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.hider-guide-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.guide-section {
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.guide-section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.guide-section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.guide-section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-ui-text-secondary);
}

.guide-section-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.guide-section-title {
  flex: 1;
  font-weight: 600;
  font-size: 0.9375rem;
}

.guide-section-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-ui-text-muted);
  transition: transform 0.2s;
}

.guide-section-chevron.expanded {
  transform: rotate(180deg);
}

.guide-section-chevron svg {
  width: 1.25rem;
  height: 1.25rem;
}

.guide-section-content {
  padding: 0 1rem 1rem;
  color: var(--color-ui-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
}

.guide-section-content p {
  margin-bottom: 0.75rem;
}

.guide-section-content p:last-child {
  margin-bottom: 0;
}

.guide-section-content ul {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.guide-section-content li {
  margin-bottom: 0.375rem;
}

.guide-section-content strong {
  color: white;
  font-weight: 600;
}
</style>
