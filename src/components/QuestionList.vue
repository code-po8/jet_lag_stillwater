<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { QUESTION_CATEGORIES, QuestionCategoryId, type Question } from '@/types/question'
import { ALL_QUESTIONS } from '@/data/questions'
import { getCategoryColor } from '@/design/colors'

// Emit event when question is selected or re-ask is clicked
const emit = defineEmits<{
  questionSelect: [question: Question]
  reaskSelect: [{ question: Question; isReask: boolean }]
}>()

const questionStore = useQuestionStore()
const gameStore = useGameStore()

// Categories disabled during end-game phase
const END_GAME_DISABLED_CATEGORIES = [QuestionCategoryId.Photo, QuestionCategoryId.Tentacle]

// Check if currently in end-game phase
const isEndGamePhase = computed(() => gameStore.currentPhase === GamePhase.EndGame)

// Track which categories are expanded (collapsed by default for QUX-002)
const expandedCategories = ref<Set<string>>(new Set())

// Get all questions grouped by category (including asked and pending)
const questionsByCategory = computed(() => {
  const grouped = new Map<string, Question[]>()

  QUESTION_CATEGORIES.forEach((category) => {
    const questions = ALL_QUESTIONS.filter((q) => q.categoryId === category.id)
    grouped.set(category.id, questions)
  })

  return grouped
})

// Get set of asked question IDs
const askedQuestionIds = computed(() => {
  return new Set(questionStore.askedQuestions.map((aq) => aq.questionId))
})

// Get pending question ID
const pendingQuestionId = computed(() => {
  return questionStore.pendingQuestion?.questionId ?? null
})

// Get stats for each category
const categoryStats = computed(() => questionStore.getCategoryStats())

function getCategoryStats(categoryId: string) {
  return categoryStats.value.find((s) => s.categoryId === categoryId)
}

/**
 * Check if a category is disabled (e.g., Photo/Tentacle during end-game)
 */
function isCategoryDisabled(categoryId: string): boolean {
  if (
    isEndGamePhase.value &&
    END_GAME_DISABLED_CATEGORIES.includes(categoryId as QuestionCategoryId)
  ) {
    return true
  }
  return false
}

function toggleCategory(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

function isCategoryExpanded(categoryId: string): boolean {
  return expandedCategories.value.has(categoryId)
}

/**
 * Get the status of a question
 */
function getQuestionStatus(questionId: string): 'available' | 'asked' | 'pending' {
  if (pendingQuestionId.value === questionId) {
    return 'pending'
  }
  if (askedQuestionIds.value.has(questionId)) {
    return 'asked'
  }
  return 'available'
}

/**
 * Check if a question can be selected
 * Questions cannot be selected if:
 * - Another question is pending
 * - The question has already been asked
 * - The question's category is disabled (e.g., Photo/Tentacle during end-game)
 */
function isQuestionSelectable(questionId: string): boolean {
  const status = getQuestionStatus(questionId)
  // Can't select asked questions
  if (status === 'asked') return false
  // Can't select any question while another is pending
  if (pendingQuestionId.value !== null) return false
  // Can't select questions from disabled categories (Photo/Tentacle in end-game)
  const question = ALL_QUESTIONS.find((q) => q.id === questionId)
  if (question && isCategoryDisabled(question.categoryId)) return false
  return true
}

/**
 * Handle question click
 */
function handleQuestionClick(question: Question) {
  if (isQuestionSelectable(question.id)) {
    emit('questionSelect', question)
  }
}

/**
 * Check if re-ask button should be disabled
 */
function isReaskDisabled(): boolean {
  return pendingQuestionId.value !== null
}

/**
 * Handle re-ask button click
 */
function handleReaskClick(event: Event, question: Question) {
  event.stopPropagation() // Prevent triggering the parent click handler
  if (!isReaskDisabled()) {
    emit('reaskSelect', { question, isReask: true })
  }
}

/**
 * Get CSS classes for question based on status
 */
function getQuestionClasses(questionId: string): string {
  const status = getQuestionStatus(questionId)
  const baseClasses = 'py-3 text-sm text-slate-200'

  switch (status) {
    case 'asked':
      return `${baseClasses} opacity-50 line-through cursor-not-allowed text-slate-500`
    case 'pending':
      return `${baseClasses} bg-brand-gold/20 font-medium text-brand-gold`
    case 'available':
      return pendingQuestionId.value
        ? `${baseClasses} cursor-not-allowed opacity-75`
        : `${baseClasses} cursor-pointer hover:bg-slate-700/50`
  }
}

/**
 * Get the background color style for a category header
 */
function getCategoryHeaderStyle(categoryId: string): Record<string, string> {
  return {
    backgroundColor: getCategoryColor(categoryId as QuestionCategoryId),
  }
}
</script>

<template>
  <div data-testid="question-list-container" class="overflow-y-auto p-4">
    <div
      v-for="category in QUESTION_CATEGORIES"
      :key="category.id"
      :data-testid="`category-${category.id}`"
      class="mb-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
    >
      <!-- Category Header with category-specific color -->
      <button
        :data-testid="`category-header-${category.id}`"
        :style="getCategoryHeaderStyle(category.id)"
        class="flex w-full items-center justify-between p-4 text-left text-white transition-opacity"
        :class="{ 'opacity-50': isCategoryDisabled(category.id) }"
        @click="toggleCategory(category.id)"
      >
        <div class="flex flex-col">
          <span class="text-lg font-semibold">{{ category.name }}</span>
          <span v-if="isCategoryDisabled(category.id)" class="text-sm text-red-200">
            Not available in end-game
          </span>
          <span v-else class="text-sm text-white/80">
            {{ getCategoryStats(category.id)?.available ?? 0 }} questions available
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right text-sm font-medium">
            <div>Draw {{ category.cardsDraw }}</div>
            <div>Keep {{ category.cardsKeep }}</div>
          </div>
          <span class="text-white/70">
            {{ isCategoryExpanded(category.id) ? '▼' : '▶' }}
          </span>
        </div>
      </button>

      <!-- Questions List (collapsible) -->
      <div v-if="isCategoryExpanded(category.id)" class="border-t border-slate-700 px-4 pb-4">
        <ul class="divide-y divide-slate-700/50">
          <li
            v-for="question in questionsByCategory.get(category.id)"
            :key="question.id"
            :data-testid="`question-${question.id}`"
            :class="getQuestionClasses(question.id)"
            :aria-disabled="!isQuestionSelectable(question.id)"
            role="button"
            tabindex="0"
            @click="handleQuestionClick(question)"
            @keydown.enter="handleQuestionClick(question)"
            @keydown.space.prevent="handleQuestionClick(question)"
          >
            <div class="flex items-center justify-between gap-2">
              <span>{{ question.text }}</span>
              <div class="flex shrink-0 items-center gap-2">
                <span
                  v-if="getQuestionStatus(question.id) === 'asked'"
                  class="shrink-0 rounded bg-slate-600 px-2 py-0.5 text-xs text-slate-300"
                >
                  Asked
                </span>
                <span
                  v-else-if="getQuestionStatus(question.id) === 'pending'"
                  class="shrink-0 rounded bg-brand-gold px-2 py-0.5 text-xs font-medium text-slate-900"
                >
                  Pending
                </span>
                <!-- Re-ask button for previously asked questions -->
                <button
                  v-if="getQuestionStatus(question.id) === 'asked'"
                  type="button"
                  class="shrink-0 rounded bg-brand-cyan/20 px-2 py-0.5 text-xs font-medium text-brand-cyan hover:bg-brand-cyan/30 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="isReaskDisabled()"
                  @click="handleReaskClick($event, question)"
                >
                  Re-ask (2x)
                </button>
              </div>
            </div>
          </li>
          <li
            v-if="!questionsByCategory.get(category.id)?.length"
            class="py-3 text-center text-sm italic text-slate-500"
          >
            No questions available
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
