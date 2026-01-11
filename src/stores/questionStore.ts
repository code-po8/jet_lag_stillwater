/**
 * Question Store
 *
 * Pinia store for tracking question state in the game.
 * Tracks all available questions, asked questions, and pending questions.
 * Persists state to localStorage via the persistence service.
 */

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ALL_QUESTIONS, getQuestionById as getQuestionByIdFromData } from '@/data/questions'
import {
  QUESTION_CATEGORIES,
  type AskedQuestion,
  type Question,
  getCategoryById,
} from '@/types/question'
import { GameSize, QuestionCategoryId } from '@/types/question'
import { createPersistenceService } from '@/services/persistence'

const STORAGE_KEY = 'questions'

/**
 * Result type for question actions
 */
export interface ActionResult {
  success: boolean
  error?: string
  cardsDraw?: number
  cardsKeep?: number
  newQuestionId?: string
}

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

/**
 * Persisted state shape for localStorage
 */
interface PersistedQuestionState {
  askedQuestions: AskedQuestion[]
  pendingQuestion: AskedQuestion | null
}

/**
 * Convert date strings back to Date objects when rehydrating from localStorage.
 * JSON.stringify converts Dates to ISO strings, so we need to convert them back.
 */
function parseDates(question: AskedQuestion): AskedQuestion {
  return {
    ...question,
    askedAt: new Date(question.askedAt),
    answeredAt: question.answeredAt ? new Date(question.answeredAt) : undefined,
  }
}

export const useQuestionStore = defineStore('questions', () => {
  // Persistence service
  const persistenceService = createPersistenceService()

  // State
  const askedQuestions = ref<AskedQuestion[]>([])
  const pendingQuestion = ref<AskedQuestion | null>(null)

  // Getters
  const hasPendingQuestion = computed(() => pendingQuestion.value !== null)

  /**
   * Persist current state to localStorage
   */
  function persist(): void {
    const state: PersistedQuestionState = {
      askedQuestions: askedQuestions.value,
      pendingQuestion: pendingQuestion.value,
    }
    persistenceService.save(STORAGE_KEY, state)
  }

  /**
   * Rehydrate state from localStorage.
   * Call this when the app loads to restore previous state.
   */
  function rehydrate(): void {
    try {
      const persisted = persistenceService.load<PersistedQuestionState>(STORAGE_KEY)
      if (persisted) {
        // Convert date strings back to Date objects
        askedQuestions.value = persisted.askedQuestions.map(parseDates)
        pendingQuestion.value = persisted.pendingQuestion
          ? parseDates(persisted.pendingQuestion)
          : null
      }
    } catch {
      // If rehydration fails (e.g., corrupted data), keep default state
      // No action needed - defaults are already set
    }
  }

  // Watch for state changes and persist automatically
  watch(
    [askedQuestions, pendingQuestion],
    () => {
      persist()
    },
    { deep: true },
  )

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

  /**
   * Ask a question - marks it as pending and returns draw/keep values.
   * Prevents asking if another question is already pending or if question was already asked.
   */
  function askQuestion(questionId: string): ActionResult {
    // Check if a question is already pending
    if (pendingQuestion.value !== null) {
      return { success: false, error: 'A question is already pending' }
    }

    // Check if the question exists
    const question = getQuestionByIdFromData(questionId)
    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Check if the question was already asked
    const alreadyAsked = askedQuestions.value.some((aq) => aq.questionId === questionId)
    if (alreadyAsked) {
      return { success: false, error: 'Question has already been asked' }
    }

    // Get the category for draw/keep values
    const category = getCategoryById(question.categoryId)
    if (!category) {
      return { success: false, error: 'Question category not found' }
    }

    // Mark the question as pending
    pendingQuestion.value = {
      questionId,
      categoryId: question.categoryId,
      answer: '',
      askedAt: new Date(),
      vetoed: false,
    }

    return {
      success: true,
      cardsDraw: category.cardsDraw,
      cardsKeep: category.cardsKeep,
    }
  }

  /**
   * Answer a pending question - records the answer and moves it to asked questions.
   */
  function answerQuestion(questionId: string, answer: string): ActionResult {
    // Check if a question is pending
    if (pendingQuestion.value === null) {
      return { success: false, error: 'No question is pending' }
    }

    // Check if the question ID matches
    if (pendingQuestion.value.questionId !== questionId) {
      return { success: false, error: 'Question ID does not match pending question' }
    }

    // Record the answer and move to asked questions
    const answeredQuestion: AskedQuestion = {
      ...pendingQuestion.value,
      answer,
      answeredAt: new Date(),
      vetoed: false,
    }

    askedQuestions.value.push(answeredQuestion)
    pendingQuestion.value = null

    return { success: true }
  }

  /**
   * Veto a pending question - returns it to available (but hider still gets cards).
   * The question is NOT added to asked questions, so it can be asked again.
   */
  function vetoQuestion(questionId: string): ActionResult {
    // Check if a question is pending
    if (pendingQuestion.value === null) {
      return { success: false, error: 'No question is pending' }
    }

    // Check if the question ID matches
    if (pendingQuestion.value.questionId !== questionId) {
      return { success: false, error: 'Question ID does not match pending question' }
    }

    // Get the category for draw/keep values (hider still gets cards on veto)
    const question = getQuestionByIdFromData(questionId)
    const category = question ? getCategoryById(question.categoryId) : undefined

    // Clear the pending question (returns it to available)
    pendingQuestion.value = null

    return {
      success: true,
      cardsDraw: category?.cardsDraw,
      cardsKeep: category?.cardsKeep,
    }
  }

  /**
   * Randomize a pending question - replaces it with a random unasked question from the same category.
   */
  function randomizeQuestion(questionId: string): ActionResult {
    // Check if a question is pending
    if (pendingQuestion.value === null) {
      return { success: false, error: 'No question is pending' }
    }

    // Check if the question ID matches
    if (pendingQuestion.value.questionId !== questionId) {
      return { success: false, error: 'Question ID does not match pending question' }
    }

    const categoryId = pendingQuestion.value.categoryId
    const originalAskedAt = pendingQuestion.value.askedAt

    // Get available questions from the same category (excluding the current one)
    const availableInCategory = getAvailableQuestions(categoryId).filter(
      (q) => q.id !== questionId,
    )

    if (availableInCategory.length === 0) {
      return { success: false, error: 'No other questions available in this category' }
    }

    // Pick a random question from the available ones
    const randomIndex = Math.floor(Math.random() * availableInCategory.length)
    const newQuestion = availableInCategory[randomIndex]!

    // Update the pending question to the new one
    pendingQuestion.value = {
      questionId: newQuestion.id,
      categoryId: newQuestion.categoryId,
      answer: '',
      askedAt: originalAskedAt, // Preserve the original timestamp
      vetoed: false,
    }

    return {
      success: true,
      newQuestionId: newQuestion.id,
    }
  }

  /**
   * Reset the question store to initial state.
   * Clears all asked questions and pending question.
   */
  function reset(): void {
    askedQuestions.value = []
    pendingQuestion.value = null
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
    askQuestion,
    answerQuestion,
    vetoQuestion,
    randomizeQuestion,
    reset,
    // Persistence
    rehydrate,
  }
})
