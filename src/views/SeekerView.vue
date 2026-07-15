<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { useNotifications } from '@/composables/useNotifications'
import QuestionMenu from '@/components/QuestionMenu.vue'
import AskQuestionModal from '@/components/AskQuestionModal.vue'
import HidingPeriodTimer from '@/components/HidingPeriodTimer.vue'
import QuestionResponseTimer from '@/components/QuestionResponseTimer.vue'
import CardDrawModal from '@/components/CardDrawModal.vue'
import CurseDisplay from '@/components/CurseDisplay.vue'
import CurseActivationModal from '@/components/CurseActivationModal.vue'
import DevSkipHidingPeriod from '@/components/DevSkipHidingPeriod.vue'
import SeekerGuide from '@/components/SeekerGuide.vue'
import { GameSize, type Question } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  },
)

const gameStore = useGameStore()
const questionStore = useQuestionStore()
const cardStore = useCardStore()
const notifications = useNotifications()

// Local state
const selectedQuestion = ref<Question | null>(null)
const isReaskMode = ref(false)

// Card draw state
const drawnCards = ref<CardInstance[]>([])
const cardsToKeep = ref(0)

// Curse activation modal state
const showCurseActivationModal = ref(false)

// Seeker guide state (GUIDE-002)
const isSeekerGuideOpen = ref(false)

// Computed properties
const currentPhase = computed(() => gameStore.currentPhase)
const isHidingPeriod = computed(() => gameStore.currentPhase === GamePhase.HidingPeriod)
const askedQuestionsCount = computed(() => questionStore.askedQuestions.length)
const pendingQuestion = computed(() => questionStore.pendingQuestion)
const gameSize = computed(() => props.gameSize)
const hasActiveCurses = computed(() => cardStore.activeCurses.length > 0)

/**
 * Get display text for the current phase
 */
function getPhaseDisplayText(): string {
  switch (currentPhase.value) {
    case 'hiding-period':
      return 'Wait for hiding period to end'
    case 'seeking':
      return 'Active Seeking - Ask questions!'
    case 'end-game':
      return 'In the zone - Find the hider!'
    default:
      return currentPhase.value
  }
}

/**
 * Handle question selection from the list
 */
function handleQuestionSelect(question: Question) {
  selectedQuestion.value = question
  isReaskMode.value = false
}

/**
 * Handle re-ask selection from the list
 */
function handleReaskSelect(event: { question: Question; isReask: boolean }) {
  selectedQuestion.value = event.question
  isReaskMode.value = event.isReask
}

/**
 * Close the modal
 */
function handleModalClose() {
  selectedQuestion.value = null
  isReaskMode.value = false
}

/**
 * Handle when a question is asked
 */
function handleQuestionAsked() {
  // Modal will stay open in answer mode
}

/**
 * Handle when a question is answered
 */
function handleQuestionAnswered() {
  selectedQuestion.value = null
}

/**
 * Close the modal (issue #25): fired after the seeker submits an answer, or when
 * the hider answers on their device while the seeker's modal is still open.
 */
function handleModalCloseRequest() {
  selectedQuestion.value = null
  isReaskMode.value = false
}

/**
 * The hider answered on their device while the seeker's modal was open (issue
 * #25). Surface it so the seeker knows the answer arrived.
 */
function handleRemoteAnswered(event: { questionId: string; answer: string }) {
  notifications.notify(`Hider answered: ${event.answer}`, 'info')
}

/**
 * Handle card draw event from AskQuestionModal
 * Draws cards from the deck and shows the CardDrawModal for selection
 */
function handleCardDraw(event: { cardsDraw: number; cardsKeep: number }) {
  // Close the question modal
  selectedQuestion.value = null

  // Draw cards from deck (temporarily, not to hand yet)
  const result = cardStore.drawCards(event.cardsDraw)
  if (result.success && result.drawnCards) {
    // Store the drawn cards temporarily - they're already in the hand from drawCards
    // We need to remove them and let the player choose which to keep
    drawnCards.value = result.drawnCards
    cardsToKeep.value = event.cardsKeep

    // Note: drawCards already added cards to hand, so we need a different approach
    // The player will select which to keep, and we'll discard the rest
  }
}

/**
 * Handle card selection confirmation from CardDrawModal
 */
function handleCardDrawConfirm(event: {
  keptCards: CardInstance[]
  discardedCards: CardInstance[]
}) {
  // Discard the cards that weren't selected
  for (const card of event.discardedCards) {
    cardStore.discardCard(card.instanceId)
  }

  // Clear the drawn cards state
  drawnCards.value = []
  cardsToKeep.value = 0
}

/**
 * Handle curse cleared event from CurseDisplay
 */
function handleCurseCleared(event: { curseName: string; reason: 'manual' | 'expired' }) {
  notifications.notifyCurseCleared(event.curseName)
}

/**
 * Open the curse activation modal
 */
function openCurseActivationModal() {
  showCurseActivationModal.value = true
}

/**
 * Handle curse activation confirmation
 */
function handleCurseActivationConfirm(event: { curseId: string }) {
  cardStore.activateCurseManually(event.curseId)
  showCurseActivationModal.value = false
  notifications.notify('Curse activated!', 'warning')
}

/**
 * Handle curse activation cancellation
 */
function handleCurseActivationCancel() {
  showCurseActivationModal.value = false
}
</script>

<template>
  <div data-testid="seeker-view" class="seeker-view">
    <!-- Role Indicator with Help Button -->
    <div class="seeker-header-row">
      <div data-testid="role-indicator" class="seeker-role-indicator">
        <svg class="seeker-role-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </svg>
        <span>Seeker</span>
      </div>
      <button
        data-testid="seeker-help-btn"
        class="seeker-help-btn"
        aria-label="Open seeker guide"
        @click="isSeekerGuideOpen = true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
          />
        </svg>
      </button>
    </div>

    <!-- Phase Status -->
    <div data-testid="phase-status" class="seeker-phase-status">
      {{ getPhaseDisplayText() }}
    </div>

    <!-- Hider Moving Notification -->
    <div
      v-if="gameStore.isHiderMoving"
      data-testid="hider-moving-notification"
      class="seeker-moving-alert"
    >
      <div class="seeker-moving-header">
        <svg class="seeker-moving-icon" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="seeker-moving-title">Hider is Moving!</span>
      </div>
      <p class="seeker-moving-text">
        Stay put and wait for the hider to establish a new hiding zone. The hiding timer is paused.
      </p>
    </div>

    <!-- Hiding Period Timer -->
    <HidingPeriodTimer v-if="isHidingPeriod" role="seeker" />

    <!-- Dev Skip Button (only in dev mode during hiding period) -->
    <DevSkipHidingPeriod />

    <!-- Question Response Timer -->
    <QuestionResponseTimer role="seeker" :game-size="gameSize" />

    <!-- Answers Summary -->
    <div data-testid="answers-summary" class="stat-card stat-card-blue seeker-questions-stat">
      <div class="seeker-stat-info">
        <svg class="seeker-stat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
          />
        </svg>
        <span class="stat-card-label">Questions Asked</span>
      </div>
      <span class="stat-card-value seeker-stat-value">{{ askedQuestionsCount }}</span>
    </div>

    <!-- Pending Question Alert -->
    <div v-if="pendingQuestion" class="seeker-pending-alert">
      <svg class="seeker-pending-icon" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
      </svg>
      Awaiting answer...
    </div>

    <!-- Hider Played Curse Button (PHYS-002) -->
    <button
      data-testid="hider-played-curse-button"
      type="button"
      class="seeker-curse-btn"
      @click="openCurseActivationModal"
    >
      <svg class="seeker-curse-icon" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clip-rule="evenodd"
        />
      </svg>
      Hider Played Curse
    </button>

    <!-- Active Curses Section -->
    <section
      v-if="hasActiveCurses"
      data-testid="seeker-curses-section"
      class="seeker-curses-section"
    >
      <CurseDisplay :game-size="gameSize" @curse-cleared="handleCurseCleared" />
    </section>

    <!-- Questions Section -->
    <section data-testid="seeker-questions-section" class="seeker-questions-section">
      <QuestionMenu @question-select="handleQuestionSelect" @reask-select="handleReaskSelect" />
    </section>

    <!-- Ask Question Modal -->
    <AskQuestionModal
      :question="selectedQuestion"
      :is-reask="isReaskMode"
      @cancel="handleModalClose"
      @close="handleModalCloseRequest"
      @asked="handleQuestionAsked"
      @answered="handleQuestionAnswered"
      @remote-answered="handleRemoteAnswered"
      @card-draw="handleCardDraw"
    />

    <!-- Card Draw Modal -->
    <CardDrawModal
      :drawn-cards="drawnCards"
      :keep-count="cardsToKeep"
      @confirm="handleCardDrawConfirm"
    />

    <!-- Curse Activation Modal (PHYS-002) -->
    <CurseActivationModal
      :is-open="showCurseActivationModal"
      :game-size="gameSize"
      @confirm="handleCurseActivationConfirm"
      @cancel="handleCurseActivationCancel"
    />

    <!-- Seeker Guide (GUIDE-002) -->
    <SeekerGuide :is-open="isSeekerGuideOpen" @close="isSeekerGuideOpen = false" />
  </div>
</template>

<style scoped>
.seeker-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

/* Header row with role indicator and help button */
.seeker-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Role indicator */
.seeker-role-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.1em;
  color: var(--color-role-seeker);
}

/* Help button */
.seeker-help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: var(--color-ui-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.seeker-help-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.seeker-help-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.seeker-role-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* Phase status */
.seeker-phase-status {
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  text-align: center;
  color: var(--color-ui-text-secondary);
  font-weight: 500;
}

/* Hider moving alert */
.seeker-moving-alert {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.15) 100%);
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 12px;
}

.seeker-moving-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.seeker-moving-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-role-hider);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.seeker-moving-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  color: var(--color-role-hider);
}

.seeker-moving-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: center;
}

/* Questions stat */
.seeker-questions-stat {
  padding: 1rem 1.25rem;
}

.seeker-stat-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seeker-stat-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-status-info);
}

.seeker-stat-value {
  color: var(--color-status-info);
}

/* Pending alert */
.seeker-pending-alert {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(180, 83, 9, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  color: var(--color-status-warning);
  font-weight: 500;
}

.seeker-pending-icon {
  width: 1.25rem;
  height: 1.25rem;
  animation: pulse 1.5s ease-in-out infinite;
}

/* Curse button */
.seeker-curse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(126, 34, 206, 0.1) 100%);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 10px;
  color: #c084fc;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seeker-curse-btn:hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.2) 100%);
  border-color: rgba(168, 85, 247, 0.5);
}

.seeker-curse-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Curses section */
.seeker-curses-section {
  max-height: 16rem;
  overflow: hidden;
}

/* Questions section */
.seeker-questions-section {
  flex: 1;
  overflow: hidden;
}
</style>
