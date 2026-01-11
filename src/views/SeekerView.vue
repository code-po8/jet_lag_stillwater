<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useQuestionStore } from '@/stores/questionStore'
import QuestionList from '@/components/QuestionList.vue'
import AskQuestionModal from '@/components/AskQuestionModal.vue'
import type { Question } from '@/types/question'

const gameStore = useGameStore()
const questionStore = useQuestionStore()

// Local state
const selectedQuestion = ref<Question | null>(null)

// Computed properties
const currentPhase = computed(() => gameStore.currentPhase)
const askedQuestionsCount = computed(() => questionStore.askedQuestions.length)
const pendingQuestion = computed(() => questionStore.pendingQuestion)

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
    />
  </div>
</template>
