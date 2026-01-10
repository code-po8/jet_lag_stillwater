/**
 * Question Store
 *
 * Pinia store for tracking question state in the game.
 * Tracks all available questions, asked questions, and pending questions.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ALL_QUESTIONS, getQuestionById as getQuestionByIdFromData } from '@/data/questions'
import { QUESTION_CATEGORIES, type AskedQuestion, type Question } from '@/types/question'
import { GameSize, QuestionCategoryId } from '@/types/question'

/**
 * Stats for a question category
 */
export interface CategoryStats {
  categoryId: QuestionCategoryId
  name: string
  total: number
  available: number
  asked: number
  cardsDraw: number
  cardsKeep: number
}

export const useQuestionStore = defineStore('questions', () => {
  // State
  const askedQuestions = ref<AskedQuestion[]>([])
  const pendingQuestion = ref<AskedQuestion | null>(null)

  // Getters
  const hasPendingQuestion = computed(() => pendingQuestion.value !== null)

  /**
   * Get all available questions, optionally filtered by category.
   * Filters out questions that have already been asked.
   */
  function getAvailableQuestions(categoryId?: QuestionCategoryId): Question[] {
    const askedIds = new Set(askedQuestions.value.map((aq) => aq.questionId))

    let questions = ALL_QUESTIONS.filter((q) => !askedIds.has(q.id))

    if (categoryId) {
      questions = questions.filter((q) => q.categoryId === categoryId)
    }

    return questions
  }

  /**
   * Get available questions filtered by game size.
   * Also filters out already asked questions.
   */
  function getAvailableQuestionsForGameSize(
    gameSize: GameSize,
    categoryId?: QuestionCategoryId,
  ): Question[] {
    const askedIds = new Set(askedQuestions.value.map((aq) => aq.questionId))

    let questions = ALL_QUESTIONS.filter(
      (q) => !askedIds.has(q.id) && q.availableIn.includes(gameSize),
    )

    if (categoryId) {
      questions = questions.filter((q) => q.categoryId === categoryId)
    }

    return questions
  }

  /**
   * Get a question by its ID
   */
  function getQuestionById(id: string): Question | undefined {
    return getQuestionByIdFromData(id)
  }

  /**
   * Get stats for all categories
   */
  function getCategoryStats(): CategoryStats[] {
    const askedIds = new Set(askedQuestions.value.map((aq) => aq.questionId))

    return QUESTION_CATEGORIES.map((category) => {
      const categoryQuestions = ALL_QUESTIONS.filter((q) => q.categoryId === category.id)
      const askedCount = categoryQuestions.filter((q) => askedIds.has(q.id)).length

      return {
        categoryId: category.id,
        name: category.name,
        total: categoryQuestions.length,
        available: categoryQuestions.length - askedCount,
        asked: askedCount,
        cardsDraw: category.cardsDraw,
        cardsKeep: category.cardsKeep,
      }
    })
  }

  return {
    // State
    askedQuestions,
    pendingQuestion,
    // Getters
    hasPendingQuestion,
    // Actions/Methods
    getAvailableQuestions,
    getAvailableQuestionsForGameSize,
    getQuestionById,
    getCategoryStats,
  }
})
