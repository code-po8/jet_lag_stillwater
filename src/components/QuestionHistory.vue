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
  <div data-testid="question-history-container" class="history-container">
    <!-- Header -->
    <div class="history-header">
      <svg class="history-header-icon" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        />
      </svg>
      <h2 class="history-title">QUESTION HISTORY</h2>
    </div>

    <!-- Category Filter -->
    <div
      v-if="questionStore.askedQuestions.length > 0"
      data-testid="category-filter"
      class="history-filters"
    >
      <!-- All filter -->
      <button
        type="button"
        class="history-filter-btn"
        :class="{ 'history-filter-btn-active': isFilterActive(null) }"
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
        class="history-filter-btn"
        :class="{ 'history-filter-btn-active': isFilterActive(category.id) }"
        :aria-pressed="isFilterActive(category.id)"
        @click="setFilter(category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="questionStore.askedQuestions.length === 0" class="history-empty">
      <svg class="history-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p class="history-empty-text">No questions have been asked yet.</p>
    </div>

    <!-- History List -->
    <div v-else class="history-list">
      <div
        v-for="(askedQuestion, index) in sortedAskedQuestions"
        :key="`${askedQuestion.questionId}-${index}`"
        :data-testid="`history-item-${askedQuestion.questionId}`"
        role="button"
        tabindex="0"
        class="history-item"
        @click="handleEntryClick(askedQuestion)"
        @keydown="handleEntryKeydown($event, askedQuestion)"
      >
        <!-- Category and Timestamp Row -->
        <div class="history-item-header">
          <span class="history-category-badge">
            {{ getCategoryName(askedQuestion.categoryId) }}
          </span>
          <div class="history-item-meta">
            <!-- Re-ask Badge -->
            <span
              v-if="askedQuestion.isReask"
              data-testid="reask-badge"
              class="history-badge history-badge-reask"
            >
              Re-ask
            </span>
            <!-- Vetoed Badge -->
            <span
              v-if="askedQuestion.vetoed"
              data-testid="vetoed-badge"
              class="history-badge history-badge-vetoed"
            >
              Vetoed
            </span>
            <span data-testid="timestamp" class="history-timestamp">
              {{ formatTimestamp(askedQuestion.askedAt) }}
            </span>
          </div>
        </div>

        <!-- Question Text -->
        <p class="history-question-text">
          {{ getQuestionText(askedQuestion.questionId) }}
        </p>

        <!-- Answer -->
        <div v-if="askedQuestion.answer && !askedQuestion.vetoed" class="history-answer">
          <span class="history-answer-label">Answer:</span>
          <span class="history-answer-value">{{ askedQuestion.answer }}</span>
        </div>
        <div v-else-if="askedQuestion.vetoed" class="history-vetoed-text">
          Question was vetoed and returned to available
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-container {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.history-header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-brand-cyan);
}

.history-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.1em;
  color: white;
}

/* Filters */
.history-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.history-filter-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--color-ui-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-filter-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.history-filter-btn-active {
  background: linear-gradient(135deg, var(--color-brand-red) 0%, var(--color-brand-red-dark) 100%);
  border-color: transparent;
  color: white;
}

/* Empty state */
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.history-empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-ui-text-muted);
  margin-bottom: 1rem;
}

.history-empty-text {
  color: var(--color-ui-text-muted);
}

/* History list */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  padding: 1rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.15);
}

.history-item:focus {
  outline: none;
  border-color: var(--color-brand-cyan);
  box-shadow: 0 0 0 2px rgba(0, 170, 255, 0.2);
}

.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.history-category-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-ui-text-secondary);
}

.history-item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
}

.history-badge-reask {
  background: var(--color-status-info);
  color: white;
}

.history-badge-vetoed {
  background: var(--color-status-warning);
  color: white;
}

.history-timestamp {
  font-size: 0.75rem;
  color: var(--color-ui-text-muted);
}

.history-question-text {
  font-size: 0.875rem;
  color: var(--color-ui-text-primary);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.history-answer {
  font-size: 0.875rem;
}

.history-answer-label {
  color: var(--color-ui-text-muted);
}

.history-answer-value {
  color: white;
  font-weight: 500;
  margin-left: 0.25rem;
}

.history-vetoed-text {
  font-size: 0.875rem;
  color: var(--color-status-warning);
  font-style: italic;
}
</style>
