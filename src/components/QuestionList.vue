<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { QUESTION_CATEGORIES, type Question } from '@/types/question'

const questionStore = useQuestionStore()

// Track which categories are expanded
const expandedCategories = ref<Set<string>>(new Set(QUESTION_CATEGORIES.map((c) => c.id)))

// Get questions grouped by category
const questionsByCategory = computed(() => {
  const grouped = new Map<string, Question[]>()

  QUESTION_CATEGORIES.forEach((category) => {
    const questions = questionStore.getAvailableQuestions(category.id)
    grouped.set(category.id, questions)
  })

  return grouped
})

// Get stats for each category
const categoryStats = computed(() => questionStore.getCategoryStats())

function getCategoryStats(categoryId: string) {
  return categoryStats.value.find((s) => s.categoryId === categoryId)
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
        @click="toggleCategory(category.id)"
      >
        <div class="flex flex-col">
          <span class="text-lg font-semibold">{{ category.name }}</span>
          <span class="text-sm text-gray-500">
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
            class="py-3 text-sm"
          >
            {{ question.text }}
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
