<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import QuestionList from '@/components/QuestionList.vue'
import AskQuestionModal from '@/components/AskQuestionModal.vue'
import HidingPeriodTimer from '@/components/HidingPeriodTimer.vue'
import QuestionResponseTimer from '@/components/QuestionResponseTimer.vue'
import CardDrawModal from '@/components/CardDrawModal.vue'
import CurseDisplay from '@/components/CurseDisplay.vue'
import { GameSize, type Question } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  }
)

const gameStore = useGameStore()
const questionStore = useQuestionStore()
const cardStore = useCardStore()

// Local state
const selectedQuestion = ref<Question | null>(null)

// Card draw state
const drawnCards = ref<CardInstance[]>([])
const cardsToKeep = ref(0)

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
}

/**
 * Close the modal
 */
function handleModalClose() {
  selectedQuestion.value = null
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
function handleCardDrawConfirm(event: { keptCards: CardInstance[]; discardedCards: CardInstance[] }) {
  // Discard the cards that weren't selected
  for (const card of event.discardedCards) {
    cardStore.discardCard(card.instanceId)
  }

  // Clear the drawn cards state
  drawnCards.value = []
  cardsToKeep.value = 0
}
</script>

<template>
  <div data-testid="seeker-view" class="flex flex-col gap-4 p-4">
    <!-- Role Indicator -->
    <div data-testid="role-indicator" class="text-center text-xl font-bold text-blue-400">
      Seeker
    </div>

    <!-- Phase Status -->
    <div
      data-testid="phase-status"
      class="rounded-lg bg-slate-800 p-3 text-center text-slate-300"
    >
      {{ getPhaseDisplayText() }}
    </div>

    <!-- Hiding Period Timer -->
    <HidingPeriodTimer v-if="isHidingPeriod" role="seeker" />

    <!-- Question Response Timer -->
    <QuestionResponseTimer role="seeker" :game-size="gameSize" />

    <!-- Answers Summary -->
    <div
      data-testid="answers-summary"
      class="flex items-center justify-between rounded-lg bg-blue-900/50 p-4"
    >
      <span class="text-lg font-medium text-blue-200">Questions Asked</span>
      <span class="text-2xl font-bold text-blue-400">{{ askedQuestionsCount }}</span>
    </div>

    <!-- Pending Question Alert -->
    <div
      v-if="pendingQuestion"
      class="rounded-lg border border-yellow-500/50 bg-yellow-900/30 p-3 text-center text-yellow-200"
    >
      Awaiting answer...
    </div>

    <!-- Active Curses Section -->
    <section v-if="hasActiveCurses" data-testid="seeker-curses-section" class="max-h-64 overflow-hidden">
      <CurseDisplay :game-size="gameSize" />
    </section>

    <!-- Questions Section -->
    <section data-testid="seeker-questions-section" class="flex-1 overflow-hidden">
      <h2 class="mb-3 text-lg font-semibold text-white">Available Questions</h2>
      <QuestionList @question-select="handleQuestionSelect" />
    </section>

    <!-- Ask Question Modal -->
    <AskQuestionModal
      :question="selectedQuestion"
      @cancel="handleModalClose"
      @asked="handleQuestionAsked"
      @answered="handleQuestionAnswered"
      @card-draw="handleCardDraw"
    />

    <!-- Card Draw Modal -->
    <CardDrawModal
      :drawn-cards="drawnCards"
      :keep-count="cardsToKeep"
      @confirm="handleCardDrawConfirm"
    />
  </div>
</template>
