<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { QUESTION_CATEGORIES, type AskedQuestion, QuestionCategoryId } from '@/types/question'
import { getQuestionById } from '@/data/questions'

// Emit event when entry is selected
const emit = defineEmits<{
  select: [askedQuestion: AskedQuestion]
}>()

const questionStore = useQuestionStore()

// Selected category filter (null = All)
const selectedCategoryFilter = ref<QuestionCategoryId | null>(null)

/**
 * Get asked questions sorted in reverse chronological order (newest first)
 */
const sortedAskedQuestions = computed(() => {
  let questions = [...questionStore.askedQuestions]

  // Apply category filter if selected
  if (selectedCategoryFilter.value !== null) {
    questions = questions.filter((q) => q.categoryId === selectedCategoryFilter.value)
  }

  // Sort by askedAt descending (newest first)
  return questions.sort((a, b) => {
    return new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime()
  })
})

/**
 * Get unique categories that have asked questions
 */
const categoriesWithAskedQuestions = computed(() => {
  const categoryIds = new Set(questionStore.askedQuestions.map((q) => q.categoryId))
  return QUESTION_CATEGORIES.filter((c) => categoryIds.has(c.id))
})

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/**
 * Get the question text by ID
 */
function getQuestionText(questionId: string): string {
  const question = getQuestionById(questionId)
  return question?.text ?? 'Unknown question'
}

/**
 * Get category name by ID
 */
function getCategoryName(categoryId: QuestionCategoryId): string {
  const category = QUESTION_CATEGORIES.find((c) => c.id === categoryId)
  return category?.name ?? categoryId
}

/**
 * Handle entry click
 */
function handleEntryClick(askedQuestion: AskedQuestion) {
  emit('select', askedQuestion)
}

/**
 * Handle keyboard navigation on entry
 */
function handleEntryKeydown(event: KeyboardEvent, askedQuestion: AskedQuestion) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select', askedQuestion)
  }
}

/**
 * Set category filter
 */
function setFilter(categoryId: QuestionCategoryId | null) {
  selectedCategoryFilter.value = categoryId
}

/**
 * Check if a filter is active
 */
function isFilterActive(categoryId: QuestionCategoryId | null): boolean {
  return selectedCategoryFilter.value === categoryId
}
</script>

<template>
  <div data-testid="question-history-container" class="flex flex-col overflow-y-auto p-4">
    <!-- Header -->
    <h2 class="mb-4 text-xl font-semibold text-white">Question History</h2>

    <!-- Category Filter -->
    <div
      v-if="questionStore.askedQuestions.length > 0"
      data-testid="category-filter"
      class="mb-4 flex flex-wrap gap-2"
    >
      <!-- All filter -->
      <button
        type="button"
        :class="[
          'rounded-full px-3 py-1 text-sm font-medium transition-colors',
          isFilterActive(null)
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
        ]"
        :aria-pressed="isFilterActive(null)"
        @click="setFilter(null)"
      >
        All
      </button>

      <!-- Category filters (only show categories with asked questions) -->
      <button
        v-for="category in categoriesWithAskedQuestions"
        :key="category.id"
        type="button"
        :class="[
          'rounded-full px-3 py-1 text-sm font-medium transition-colors',
          isFilterActive(category.id)
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
        ]"
        :aria-pressed="isFilterActive(category.id)"
        @click="setFilter(category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="questionStore.askedQuestions.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <div class="mb-4 text-4xl">📋</div>
      <p class="text-slate-400">No questions have been asked yet.</p>
    </div>

    <!-- History List -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="(askedQuestion, index) in sortedAskedQuestions"
        :key="`${askedQuestion.questionId}-${index}`"
        :data-testid="`history-item-${askedQuestion.questionId}`"
        role="button"
        tabindex="0"
        class="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-4 py-3 transition-colors hover:bg-slate-700"
        @click="handleEntryClick(askedQuestion)"
        @keydown="handleEntryKeydown($event, askedQuestion)"
      >
        <!-- Category and Timestamp Row -->
        <div class="mb-2 flex items-center justify-between">
          <span class="rounded bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-200">
            {{ getCategoryName(askedQuestion.categoryId) }}
          </span>
          <div class="flex items-center gap-2">
            <!-- Re-ask Badge -->
            <span
              v-if="askedQuestion.isReask"
              data-testid="reask-badge"
              class="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white"
            >
              Re-ask
            </span>
            <!-- Vetoed Badge -->
            <span
              v-if="askedQuestion.vetoed"
              data-testid="vetoed-badge"
              class="rounded bg-amber-600 px-2 py-0.5 text-xs font-medium text-white"
            >
              Vetoed
            </span>
            <span data-testid="timestamp" class="text-xs text-slate-400">
              {{ formatTimestamp(askedQuestion.askedAt) }}
            </span>
          </div>
        </div>

        <!-- Question Text -->
        <p class="mb-2 text-sm text-slate-200">
          {{ getQuestionText(askedQuestion.questionId) }}
        </p>

        <!-- Answer -->
        <div v-if="askedQuestion.answer && !askedQuestion.vetoed" class="text-sm">
          <span class="text-slate-400">Answer: </span>
          <span class="text-white">{{ askedQuestion.answer }}</span>
        </div>
        <div v-else-if="askedQuestion.vetoed" class="text-sm text-amber-400">
          Question was vetoed and returned to available
        </div>
      </div>
    </div>
  </div>
</template>
