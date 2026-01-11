<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { QUESTION_CATEGORIES, QuestionCategoryId, type Question } from '@/types/question'
import { ALL_QUESTIONS } from '@/data/questions'

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

// Track which categories are expanded
const expandedCategories = ref<Set<string>>(new Set(QUESTION_CATEGORIES.map((c) => c.id)))

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
  if (isEndGamePhase.value && END_GAME_DISABLED_CATEGORIES.includes(categoryId as QuestionCategoryId)) {
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
  const baseClasses = 'py-3 text-sm'

  switch (status) {
    case 'asked':
      return `${baseClasses} opacity-50 line-through cursor-not-allowed`
    case 'pending':
      return `${baseClasses} bg-yellow-100 font-medium`
    case 'available':
      return pendingQuestionId.value
        ? `${baseClasses} cursor-not-allowed`
        : `${baseClasses} cursor-pointer hover:bg-gray-50`
  }
}
</script>

<template>
  <div data-testid="question-list-container" class="overflow-y-auto">
    <div
      v-for="category in QUESTION_CATEGORIES"
      :key="category.id"
      :data-testid="`category-${category.id}`"
      class="mb-4 rounded-lg border border-gray-200 bg-white"
    >
      <!-- Category Header -->
      <button
        :data-testid="`category-header-${category.id}`"
        class="flex w-full items-center justify-between p-4 text-left"
        :class="{ 'opacity-50': isCategoryDisabled(category.id) }"
        @click="toggleCategory(category.id)"
      >
        <div class="flex flex-col">
          <span class="text-lg font-semibold">{{ category.name }}</span>
          <span v-if="isCategoryDisabled(category.id)" class="text-sm text-red-500">
            Not available in end-game
          </span>
          <span v-else class="text-sm text-gray-500">
            {{ getCategoryStats(category.id)?.available ?? 0 }} questions available
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right text-sm">
            <div>Draw {{ category.cardsDraw }}</div>
            <div>Keep {{ category.cardsKeep }}</div>
          </div>
          <span class="text-gray-400">
            {{ isCategoryExpanded(category.id) ? '▼' : '▶' }}
          </span>
        </div>
      </button>

      <!-- Questions List (collapsible) -->
      <div
        v-if="isCategoryExpanded(category.id)"
        class="border-t border-gray-100 px-4 pb-4"
      >
        <ul class="divide-y divide-gray-100">
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
                  class="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600"
                >
                  Asked
                </span>
                <span
                  v-else-if="getQuestionStatus(question.id) === 'pending'"
                  class="shrink-0 rounded bg-yellow-500 px-2 py-0.5 text-xs text-white"
                >
                  Pending
                </span>
                <!-- Re-ask button for previously asked questions -->
                <button
                  v-if="getQuestionStatus(question.id) === 'asked'"
                  type="button"
                  class="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            class="py-3 text-center text-sm italic text-gray-400"
          >
            No questions available
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
