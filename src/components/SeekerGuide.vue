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
  'asking-questions': false,
  categories: false,
  'recording-answers': false,
  curses: false,
  'time-traps': false,
  'end-game': false,
})

function toggleSection(sectionId: string) {
  expandedSections.value[sectionId] = !expandedSections.value[sectionId]
}
</script>

<template>
  <div
    v-if="isOpen"
    data-testid="seeker-guide-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="seeker-guide-title"
    class="seeker-guide-overlay"
  >
    <div
      data-testid="seeker-guide-overlay"
      class="seeker-guide-overlay-bg"
      @click="emit('close')"
    ></div>

    <div data-testid="seeker-guide-content" class="seeker-guide-content" @click.stop>
      <!-- Header -->
      <div class="seeker-guide-header">
        <h2 id="seeker-guide-title" class="seeker-guide-title">Seeker Guide</h2>
        <button
          data-testid="seeker-guide-close-btn"
          class="seeker-guide-close-btn"
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
      <div class="seeker-guide-body">
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
              During the <strong>30-minute hiding period</strong>, you must wait while the hider
              finds their spot. During this time:
            </p>
            <ul>
              <li>You cannot move from the starting location</li>
              <li>You cannot ask any questions</li>
              <li>Use this time to review the question categories</li>
              <li>Plan your initial search strategy</li>
            </ul>
            <p>When the timer reaches zero, the seeking phase begins and you can start hunting!</p>
          </div>
        </section>

        <!-- Asking Questions Section -->
        <section
          data-testid="guide-section-asking-questions"
          class="guide-section"
          :data-expanded="expandedSections['asking-questions']"
        >
          <button
            data-testid="guide-section-asking-questions-header"
            class="guide-section-header"
            @click="toggleSection('asking-questions')"
          >
            <span class="guide-section-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Asking Questions</span>
            <span
              class="guide-section-chevron"
              :class="{ expanded: expandedSections['asking-questions'] }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['asking-questions']" class="guide-section-content">
            <p>To ask a question:</p>
            <ul>
              <li>Browse the question list by category</li>
              <li>Tap a question to open the ask modal</li>
              <li>Confirm to send the question to the hider</li>
              <li>Wait for the hider's response within the time limit</li>
            </ul>
            <p>
              You can also <strong>re-ask</strong> previously asked questions at double the card
              cost - useful when the hider may have moved!
            </p>
          </div>
        </section>

        <!-- Question Categories Section -->
        <section
          data-testid="guide-section-categories"
          class="guide-section"
          :data-expanded="expandedSections.categories"
        >
          <button
            data-testid="guide-section-categories-header"
            class="guide-section-header"
            @click="toggleSection('categories')"
          >
            <span class="guide-section-icon text-blue-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Question Categories</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.categories }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.categories" class="guide-section-content">
            <p>Each category has <strong>draw</strong> and <strong>keep</strong> values:</p>
            <ul>
              <li><strong>Matching</strong> - Yes/no questions (Draw 3, Keep 1)</li>
              <li><strong>Measuring</strong> - Distance questions (Draw 4, Keep 2)</li>
              <li><strong>Radar</strong> - Direction questions (Draw 2, Keep 1)</li>
              <li><strong>Thermometer</strong> - Warmer/colder (Draw 3, Keep 1)</li>
              <li><strong>Photo</strong> - Picture of surroundings (Draw 5, Keep 2)</li>
              <li><strong>Tentacle</strong> - Multi-part questions (Draw 4, Keep 2)</li>
            </ul>
            <p>
              When answered, you draw cards from the deck and keep the specified number - the rest
              go to the hider!
            </p>
          </div>
        </section>

        <!-- Recording Answers Section -->
        <section
          data-testid="guide-section-recording-answers"
          class="guide-section"
          :data-expanded="expandedSections['recording-answers']"
        >
          <button
            data-testid="guide-section-recording-answers-header"
            class="guide-section-header"
            @click="toggleSection('recording-answers')"
          >
            <span class="guide-section-icon text-green-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                />
              </svg>
            </span>
            <span class="guide-section-title">Recording Answers</span>
            <span
              class="guide-section-chevron"
              :class="{ expanded: expandedSections['recording-answers'] }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['recording-answers']" class="guide-section-content">
            <p>After the hider responds, record their answer in the app:</p>
            <ul>
              <li>Enter the hider's response in the text field</li>
              <li>The question and answer are saved to your history</li>
              <li>Use the history to review past answers and track patterns</li>
            </ul>
            <p>
              <strong>Note:</strong> If the hider uses their <strong>Veto</strong>, they refuse to
              answer but you still get cards!
            </p>
          </div>
        </section>

        <!-- Active Curses Section -->
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
            <span class="guide-section-title">Active Curses</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections.curses }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections.curses" class="guide-section-content">
            <p>
              When the hider plays a curse, it restricts what you can do. You must follow the
              curse's rules until it expires!
            </p>
            <p>Common curse restrictions:</p>
            <ul>
              <li>Cannot use certain transportation (buses, bikes, etc.)</li>
              <li>Cannot ask certain question types</li>
              <li>Must travel in specific ways (walk only, etc.)</li>
            </ul>
            <p>
              Active curses appear on your screen with a countdown. Check them before taking any
              action!
            </p>
          </div>
        </section>

        <!-- Time Traps Section -->
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
            <p>
              The hider can set hidden time traps in zones. If you enter a zone with a trap, it
              triggers!
            </p>
            <p>When a time trap triggers:</p>
            <ul>
              <li>You'll be notified that you've sprung a trap</li>
              <li>The hider receives a time bonus (extra hiding time)</li>
              <li>The trap is then disarmed</li>
            </ul>
            <p>Be strategic about where you search - some zones might be traps!</p>
          </div>
        </section>

        <!-- End-Game Phase Section -->
        <section
          data-testid="guide-section-end-game"
          class="guide-section"
          :data-expanded="expandedSections['end-game']"
        >
          <button
            data-testid="guide-section-end-game-header"
            class="guide-section-header"
            @click="toggleSection('end-game')"
          >
            <span class="guide-section-icon text-red-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
              </svg>
            </span>
            <span class="guide-section-title">End-Game Phase</span>
            <span class="guide-section-chevron" :class="{ expanded: expandedSections['end-game'] }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </span>
          </button>
          <div v-show="expandedSections['end-game']" class="guide-section-content">
            <p>
              When you enter the hider's zone, the <strong>end-game phase</strong> begins. Now you
              must physically find them!
            </p>
            <p>During end-game:</p>
            <ul>
              <li>The hider cannot use their Move powerup to escape</li>
              <li>You can still ask questions to narrow down their exact location</li>
              <li>Search thoroughly - they could be anywhere in the zone!</li>
            </ul>
            <p>
              The game ends when you physically locate and tag the hider. Their total hiding time is
              then recorded!
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seeker-guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.seeker-guide-overlay-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.seeker-guide-content {
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

.seeker-guide-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.seeker-guide-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #2563eb 100%);
}

.seeker-guide-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  color: var(--color-role-seeker);
}

.seeker-guide-close-btn {
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

.seeker-guide-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.seeker-guide-close-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.seeker-guide-body {
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
